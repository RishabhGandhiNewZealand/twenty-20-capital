# Trade Data Cache Documentation

## Overview

This document describes the implementation of a PostgreSQL-based caching system for trade data in the Next.js portfolio application. The system has been migrated from Vercel Blob storage to a Neon database with built-in caching for optimal performance.

## Architecture

### Database Schema

The trade data is stored in a Neon Postgres database under the `application` schema:

```sql
CREATE TABLE application.trade_data (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  market_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Buy', 'Sell', 'Reinvestment')),
  qty DECIMAL(18, 8) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  instrument_currency VARCHAR(3) NOT NULL,
  brokerage DECIMAL(18, 8) NOT NULL,
  brokerage_currency VARCHAR(3) NOT NULL,
  exch_rate DECIMAL(18, 8) NOT NULL,
  value DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

### Indexes

The following indexes are created for optimal query performance:
- `idx_trade_data_code` - For symbol-based queries
- `idx_trade_data_date` - For date-range queries
- `idx_trade_data_type` - For trade type filtering
- `idx_trade_data_code_date` - Composite index for symbol + date queries

## Caching Implementation

### Cache Layers

The application implements multiple levels of caching:

1. **Trade Data Cache** - Raw trade data from database
2. **Portfolio Compositions Cache** - Historical portfolio compositions with real prices
3. **Portfolio History Cache** - Daily portfolio performance data
4. **API Response Cache** - HTTP cache headers for client-side caching

### Cache Configuration

```typescript
const CACHE_REVALIDATE_SECONDS = 3600 // 1 hour
```

### Cached Functions

1. **getCachedTradeData()** - Fetches all trade data with caching
2. **getCachedTradeDataBySymbol(symbol)** - Fetches trade data for a specific symbol with caching
3. **getCachedPortfolioCompositions()** - Calculates and caches portfolio compositions with historical prices
4. **getCachedPortfolioHistory()** - Calculates and caches daily portfolio performance

## Data Flow

### Portfolio Compositions (Horizontal Bar Chart)

1. **First Request**:
   - Fetch cached trade data from database
   - Fetch historical prices from Yahoo Finance for all tickers
   - Fetch historical exchange rates
   - Calculate daily portfolio compositions
   - Cache results for 1 hour
   - Return data

2. **Subsequent Requests** (within 1 hour):
   - Return cached compositions immediately
   - No database or Yahoo Finance queries

### Calculation Process

The portfolio compositions are calculated with:
- Actual historical stock prices from Yahoo Finance
- Historical USD/NZD exchange rates
- Daily portfolio holdings based on trade history
- Proper handling of buys, sells, and reinvestments

## Usage

### In Server Components

```typescript
import { getCachedTradeData } from '@/lib/trade-data-cache'

export default async function PortfolioPage() {
  const trades = await getCachedTradeData()
  // Process trades...
}
```

### In Route Handlers

```typescript
import { getCachedTradeData } from '@/lib/trade-data-cache'

export async function GET() {
  const trades = await getCachedTradeData()
  // Process and return data...
}
```

## API Endpoints with Caching

All major data endpoints now use caching:

- `/api/portfolio-current` - Current portfolio holdings
- `/api/portfolio-history` - Historical portfolio performance
- `/api/portfolio-compositions` - Daily portfolio compositions (for horizontal bar chart)
- `/api/portfolio-composition/[date]` - Portfolio composition on specific date
- `/api/news/companies` - List of portfolio companies
- `/api/news` - News analysis for portfolio companies
- `/api/trade-data/cache-status` - Cache status monitoring

## Performance Benefits

1. **Reduced Database Load** - Queries execute only once per hour per unique request
2. **Reduced External API Calls** - Yahoo Finance queries are cached
3. **Faster Response Times** - Cached data serves instantly
4. **Cost Optimization** - Fewer database queries and API calls
5. **Scalability** - Can handle more concurrent users

## Monitoring

### Cache Status Endpoint

Check cache and database status:
```
GET /api/trade-data/cache-status
```

Response:
```json
{
  "status": "ok",
  "cache": {
    "revalidateSeconds": 3600,
    "revalidateReadable": "60 minutes"
  },
  "database": {
    "totalTrades": 1234,
    "uniqueSymbols": 25,
    "earliestTrade": "2020-01-01",
    "latestTrade": "2024-01-15",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

## Setup Instructions

1. **Create Database Table**
   ```bash
   npm run setup:trade-data-table
   ```

2. **Import Trade Data**
   - Use your existing data migration script to import data from CSV to the database
   - Ensure all trades are properly imported with correct data types

3. **Populate Cache (Optional)**
   ```bash
   # Start the development server first
   npm run dev
   
   # In another terminal, populate the cache
   npm run populate-cache
   ```

4. **Verify Setup**
   - Check cache status endpoint: `/api/trade-data/cache-status`
   - Test portfolio endpoints to ensure data loads correctly

## Cache Invalidation

- Caches automatically expire after 1 hour
- Manual invalidation available via `invalidateTradeDataCache()`
- Cache tags allow targeted invalidation
- When trade data is updated, caches should be invalidated

## Troubleshooting

### No Data Showing
1. Check if trade_data table exists and contains data
2. Verify database connection is working
3. Check application logs for errors

### Cache Not Working
1. Ensure Next.js is running in production mode for full caching
2. Check cache status endpoint
3. Verify `unstable_cache` is imported correctly

### Slow Initial Load
1. First request after cache expiry will be slower (fetching from Yahoo Finance)
2. Consider running `npm run populate-cache` to pre-warm the cache
3. Monitor Yahoo Finance API rate limits

### Performance Issues
1. Check database indexes are created
2. Monitor query performance in Neon dashboard
3. Consider adjusting cache TTL if needed

## Future Enhancements

1. **Incremental Updates** - Support for adding new trades without full cache invalidation
2. **Cache Warming** - Automatic cache population on application startup
3. **Cache Metrics** - Track cache hit/miss rates
4. **Configurable TTL** - Allow cache duration configuration via environment variable
5. **Partial Date Range Caching** - Cache compositions for recent dates more frequently