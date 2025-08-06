# News Cache Deployment System

This document describes the news cache population system that runs after deployment to pre-populate news data, preventing Gemini API calls when users visit the news page.

## Overview

The news page now operates in a **read-only cache mode**:
- Users visiting `/news` will only see cached data
- No Gemini API calls are triggered from the news page
- Cache is populated automatically after deployment
- Cache remains fresh for 30 days

## Components

### 1. Cache Population Script
**File**: `/scripts/populate-news-cache.ts`
- Fetches all portfolio companies
- Calls Gemini API sequentially for each company
- Stores results in PostgreSQL cache
- Skips companies with fresh cache (< 30 days old)

### 2. API Endpoint
**Route**: `/api/news/populate-cache`
- POST: Triggers cache population
- GET: Returns cache statistics
- Protected by bearer token authentication

### 3. Modified News Page
**Route**: `/api/news/company`
- Only reads from cache
- Never calls Gemini API
- Returns empty result if no cache exists

### 4. Cron Job
**Route**: `/app/api/cron/populate-news-cache/route.ts`
- Runs daily at midnight UTC
- Triggers cache population automatically
- Configured in `vercel.json`

### 5. Manual Trigger Script
**File**: `/scripts/trigger-cache-population.sh`
- Can be called after deployment
- Usage: `./scripts/trigger-cache-population.sh <deployment-url> <secret>`

## Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgres_connection_string

# Optional (but recommended)
CACHE_POPULATE_SECRET=your_secret_token
CRON_SECRET=your_cron_secret  # Required for Vercel cron jobs
```

### Vercel Configuration

The `vercel.json` file configures a daily cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/populate-news-cache",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Important**: Set `CRON_SECRET` in Vercel environment variables. Vercel will include this as a bearer token when calling the cron endpoint.

## Deployment Process

### Automatic (Recommended)

1. Deploy to Vercel
2. The daily cron job will populate cache at midnight UTC
3. For immediate population, use manual trigger or deployment hooks

### Manual Trigger

After deployment, you can manually trigger cache population:

```bash
# Using the shell script
./scripts/trigger-cache-population.sh https://your-app.vercel.app your-secret

# Using curl directly
curl -X POST https://your-app.vercel.app/api/news/populate-cache \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json"

# Force refresh all companies (ignores existing cache)
curl -X POST "https://your-app.vercel.app/api/news/populate-cache?force=true" \
  -H "Authorization: Bearer your-secret"
```

### Local Development

```bash
# Run the population script locally
npm run populate-news-cache

# Or use the API endpoint
curl -X POST http://localhost:3000/api/news/populate-cache \
  -H "Authorization: Bearer default-secret"
```

## Diagnostic Endpoints

### 1. Full System Diagnostics
```bash
curl https://your-app.vercel.app/api/news/diagnostics
```

Returns comprehensive information about:
- Environment configuration
- Cache status and statistics
- Portfolio companies
- Recommendations for fixes

### 2. Test Gemini API
```bash
curl https://your-app.vercel.app/api/news/test-gemini
```

Tests if Gemini API is properly configured and working.

### 3. Check Cache Status
```bash
curl https://your-app.vercel.app/api/news/populate-cache
```

Returns current cache statistics without triggering population.

## Vercel Deployment Hooks

To automatically populate cache after each deployment:

1. Go to your Vercel project settings
2. Navigate to "Git" → "Deploy Hooks"
3. Create a new hook with:
   - Name: "Populate News Cache"
   - Branch: main (or your production branch)
4. Use the webhook URL in your CI/CD pipeline or GitHub Actions

Example GitHub Action:

```yaml
name: Populate Cache After Deploy
on:
  deployment_status:
    types: [completed]

jobs:
  populate-cache:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cache Population
        run: |
          curl -X POST "${{ github.event.deployment_status.target_url }}/api/news/populate-cache" \
            -H "Authorization: Bearer ${{ secrets.CACHE_POPULATE_SECRET }}" \
            -H "Content-Type: application/json"
```

## Cache Behavior

- **Freshness Period**: 30 days
- **Storage**: PostgreSQL with no expiration (expires_at set to 100 years)
- **Sequential Processing**: Companies are analyzed one by one to avoid rate limits
- **Delay Between Calls**: 1 second between each company
- **Only Successful Results Cached**: Failed analyses are not stored

## Monitoring

Check cache status:

```bash
curl https://your-app.vercel.app/api/news/populate-cache
```

Response includes:
- Total cache entries
- Active entries
- Average request count per entry
- Gemini API configuration status

## Troubleshooting

### Nothing is being cached

1. **Run diagnostics first**:
   ```bash
   curl https://your-app.vercel.app/api/news/diagnostics
   ```

2. **Check Gemini API**:
   ```bash
   curl https://your-app.vercel.app/api/news/test-gemini
   ```

3. **Verify environment variables in Vercel**:
   - `GEMINI_API_KEY` - Must be set
   - `DATABASE_URL` - Must be set
   - `CACHE_POPULATE_SECRET` - Should match what you use in requests
   - `CRON_SECRET` - Required for cron jobs to work

4. **Check logs in Vercel dashboard**:
   - Go to Functions tab
   - Look for `api/news/populate-cache` logs
   - Check for specific error messages

### Common Issues

#### Cron job not running
- Ensure `CRON_SECRET` is set in Vercel environment
- Check cron job logs in Vercel Functions tab
- Verify cron job path matches exactly: `/api/cron/populate-news-cache`

#### Cache not populating
1. Check if database is accessible
2. Verify Gemini API key is valid
3. Look for rate limit errors in logs
4. Check if companies are being found correctly

#### Empty news page
- This is expected if cache hasn't been populated yet
- Manually trigger population:
  ```bash
  curl -X POST https://your-app.vercel.app/api/news/populate-cache \
    -H "Authorization: Bearer your-secret"
  ```

### Debug Steps

1. **Test individual company**:
   - Temporarily modify the populate script to test one company
   - Check logs for specific errors

2. **Check cache table directly**:
   - Connect to your PostgreSQL database
   - Query: `SELECT * FROM application.news_cache ORDER BY created_at DESC LIMIT 10;`

3. **Force refresh**:
   ```bash
   curl -X POST "https://your-app.vercel.app/api/news/populate-cache?force=true" \
     -H "Authorization: Bearer your-secret"
   ```

### Rate Limits
- The system includes exponential backoff for rate limits
- Max 3 retries with delays: 1s, 2s, 5s
- Sequential processing prevents hitting limits
- If still hitting limits, increase delay between companies