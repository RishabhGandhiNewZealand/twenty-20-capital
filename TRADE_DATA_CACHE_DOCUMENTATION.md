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

### Cache Layer

The caching is implemented using Next.js's `unstable_cache` function, which provides:
- Automatic caching of database query results
- Cache invalidation support
- Configurable revalidation periods

### Cache Configuration

```typescript
const CACHE_REVALIDATE_SECONDS = 3600 // 1 hour
const CACHE_TAG = 'trade-data'
```

### Cached Functions

1. **getCachedTradeData()** - Fetches all trade data with caching
2. **getCachedTradeDataBySymbol(symbol)** - Fetches trade data for a specific symbol with caching

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

## Cache Behavior

### First Request
1. User makes request to the application
2. Cache miss - query executes against Neon database
3. Results are cached for 1 hour
4. Data returned to user

### Subsequent Requests (within 1 hour)
1. User makes request to the application
2. Cache hit - data served from cache
3. No database query executed
4. Faster response time

### Cache Invalidation
- Cache automatically expires after 1 hour
- Manual invalidation available via `invalidateTradeDataCache()`
- Cache tags allow targeted invalidation

## Performance Benefits

1. **Reduced Database Load** - Queries execute only once per hour per unique request
2. **Faster Response Times** - Cached data serves instantly without database roundtrip
3. **Cost Optimization** - Fewer database queries reduce Neon usage costs
4. **Scalability** - Can handle more concurrent users with cached responses

## Migration from Blob Storage

The application has been migrated from Vercel Blob storage to Neon database:

### Before (Blob Storage)
- Data fetched from blob URL on every request
- CSV parsing required on each request
- No built-in caching mechanism
- Network latency for blob downloads

### After (Database + Cache)
- Data fetched from database with automatic caching
- Structured data format (no CSV parsing)
- Built-in caching with configurable TTL
- Optimized queries with indexes

## API Endpoints Updated

The following API endpoints now use cached database queries:
- `/api/portfolio-current` - Current portfolio holdings
- `/api/portfolio-history` - Historical portfolio performance
- `/api/portfolio-composition/[date]` - Portfolio composition on specific date
- `/api/news/companies` - List of portfolio companies
- `/api/news` - News analysis for portfolio companies

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
   # or
   tsx scripts/setup-trade-data-table.ts
   ```

2. **Import Trade Data**
   - Use your existing data migration script to import data from CSV to the database
   - Ensure all trades are properly imported with correct data types

3. **Verify Setup**
   - Check cache status endpoint: `/api/trade-data/cache-status`
   - Test portfolio endpoints to ensure data loads correctly

## Environment Variables

No new environment variables required. The application uses the existing `DATABASE_URL` for Neon connection.

## Troubleshooting

### No Data Showing
1. Check if trade_data table exists and contains data
2. Verify database connection is working
3. Check application logs for errors

### Cache Not Working
1. Ensure Next.js is running in production mode for full caching
2. Check cache status endpoint
3. Verify `unstable_cache` is imported correctly

### Performance Issues
1. Check database indexes are created
2. Monitor query performance in Neon dashboard
3. Consider adjusting cache TTL if needed

## Future Enhancements

1. **Incremental Updates** - Support for adding new trades without full reimport
2. **Cache Warming** - Pre-populate cache on application startup
3. **Cache Metrics** - Track cache hit/miss rates
4. **Configurable TTL** - Allow cache duration configuration via environment variable