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
**File**: `/api/cron/populate-news-cache.ts`
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
CRON_SECRET=your_cron_secret
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

## Deployment Process

### Automatic (Recommended)

1. Deploy to Vercel
2. The daily cron job will populate cache at midnight UTC
3. For immediate population, use Vercel deployment hooks

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

### Cache not populating
1. Check `GEMINI_API_KEY` is set in Vercel environment
2. Check `DATABASE_URL` is configured
3. Verify `CACHE_POPULATE_SECRET` matches between client and server
4. Check Vercel function logs for errors

### Rate limits
- The system includes exponential backoff for rate limits
- Max 3 retries with delays: 1s, 2s, 5s
- Sequential processing prevents hitting limits

### Empty news page
- This is expected if cache hasn't been populated yet
- Trigger manual population or wait for cron job
- Check cache status endpoint for diagnostics