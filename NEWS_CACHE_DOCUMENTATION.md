# News Cache Implementation Documentation

## Overview

This document describes the implementation of a PostgreSQL-based caching system for Gemini API responses in the portfolio news analysis feature. The cache is designed to reduce API calls, improve response times, and provide better reliability.

## Architecture

### Database Schema

The cache is stored in a Neon Postgres database under the `application` schema:

```sql
application.news_cache
├── id (SERIAL PRIMARY KEY)
├── company_name (VARCHAR(255))
├── cache_key (VARCHAR(255) UNIQUE)
├── response_data (JSONB)
├── start_date (DATE)
├── end_date (DATE)
├── created_at (TIMESTAMP WITH TIME ZONE)
├── updated_at (TIMESTAMP WITH TIME ZONE)
├── expires_at (TIMESTAMP WITH TIME ZONE)
├── request_count (INTEGER)
└── last_accessed (TIMESTAMP WITH TIME ZONE)
```

### Indexes

- `idx_news_cache_company_name` - Fast lookups by company
- `idx_news_cache_cache_key` - Unique cache key lookups
- `idx_news_cache_dates` - Date range queries
- `idx_news_cache_expires_at` - Efficient cleanup of expired entries

## Features

### 1. Automatic Caching

- All Gemini API responses are automatically cached
- Data is stored forever (expires_at set to 100 years in the future)
- Cache key format: `{company_name}_{start_date}_{end_date}`

### 2. Cache Hit/Miss Tracking

- Request count incremented on each cache hit
- Last accessed timestamp updated automatically
- Statistics available via API endpoint

### 3. Automatic Cleanup

- Expired entries are cleaned up when accessing cache stats
- Configurable expiration times per cache entry

### 4. Database Connection Pooling

- Uses Neon's serverless driver for optimal performance
- Connection reuse across requests

## API Integration

### Modified Endpoints

1. **GET /api/news/company?company={name}**
   - Checks cache before calling Gemini API
   - Caches successful responses automatically
   - Returns cached data when available

2. **GET /api/news/cache-stats**
   - Returns cache statistics
   - Triggers cleanup of expired entries
   - Shows cache effectiveness metrics

## Configuration

### Environment Variables

```bash
# Required for caching
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require

# Existing configuration
GEMINI_API_KEY=your_gemini_api_key
```

### Cache Settings

- Data is stored permanently (no expiration)
- expires_at is set to 100 years in the future to effectively store forever

## Usage Examples

### Testing the Cache

```bash
# Run the test script
npm run tsx scripts/test-news-cache.ts
```

### Checking Cache Statistics

```bash
# Via API
curl http://localhost:3000/api/news/cache-stats
```

### Manual Cache Operations

```typescript
import { newsCache } from '@/lib/news-cache'

// Initialize cache
await newsCache.initialize()

// Get from cache
const cached = await newsCache.get(company, startDate, endDate)

// Set in cache (stored forever)
await newsCache.set(company, startDate, endDate, data)

// Invalidate company cache
await newsCache.invalidate(company)

// Get statistics
const stats = await newsCache.getStats()
```

## Performance Benefits

1. **Reduced API Calls**: Eliminates redundant Gemini API calls
2. **Faster Response Times**: Database lookups are much faster than API calls
3. **Cost Savings**: Reduces Gemini API usage and associated costs
4. **Better Reliability**: Cached responses available even if Gemini API is down

## Monitoring

The cache provides several metrics:

- Total entries in cache
- Active (non-expired) entries
- Expired entries pending cleanup
- Total request count across all entries
- Average requests per entry

Access these via the `/api/news/cache-stats` endpoint.

## Maintenance

### Regular Cleanup

Expired entries are automatically cleaned up when:
- Cache statistics are requested
- The cleanup function is called manually

### Manual Maintenance

```typescript
import { cleanupExpiredCache } from '@/lib/db-migrations'

// Clean up expired entries
const cleaned = await cleanupExpiredCache()
console.log(`Cleaned ${cleaned} expired entries`)
```

## Error Handling

- Cache operations fail gracefully
- If cache is unavailable, the system falls back to direct API calls
- All cache errors are logged but don't interrupt the main flow

## Future Enhancements

1. **Intelligent Invalidation**: Invalidate cache based on significant market events
2. **Partial Updates**: Update only changed data instead of full replacement
3. **Cache Warming**: Pre-populate cache for frequently accessed companies
4. **Compression**: Compress large response data to save storage
5. **Cache Levels**: Implement multi-level caching (memory + database)