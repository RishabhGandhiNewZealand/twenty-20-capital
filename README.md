# Personal Portfolio Website

This is a simple Next.js-based personal website to track your portfolio, company analyses, progress reports, and more.

## Features

- **Main Page:** Shows your portfolio value (with a placeholder for a graph).
- **Analyses:** Store and view markdown files for different company analyses.
- **Reports:** Store and view markdown files for quarterly and yearly progress reports.
- **About:** Simple about page.

## Trade Data Storage

The portfolio trade data is stored in Vercel Blob storage and accessed securely using the Vercel Blob SDK:
- Uses authenticated access with `BLOB_READ_WRITE_TOKEN`
- The blob URL is configured via `TRADE_DATA_BLOB_URL` environment variable
- All data fetching happens server-side using the SDK

### Required Environment Variables

The application requires two environment variables:

1. **`BLOB_READ_WRITE_TOKEN`** - Automatically set by Vercel when you connect a Blob store
2. **`TRADE_DATA_BLOB_URL`** - The full URL to your trade data CSV file

### Vercel Setup

In your Vercel deployment, both environment variables should be available:
- `BLOB_READ_WRITE_TOKEN` is automatically created when you connect the Blob store
- `TRADE_DATA_BLOB_URL` should be set to your blob file URL

### Local Development Setup

For local development, create a `.env.local` file:
```env
# Get from Vercel Dashboard → Storage → Your Blob Store → Tokens
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx

# Your trade data blob URL
TRADE_DATA_BLOB_URL=https://your-store-id.public.blob.vercel-storage.com/path/to/your/trade-data.csv
```

### Security Features

- ✅ **Authenticated access**: Uses Vercel's blob tokens for secure access
- ✅ **Server-side only**: All blob operations happen in API routes
- ✅ **No client exposure**: Environment variables are never sent to the client
- ✅ **SDK handles auth**: Authentication is handled automatically by the SDK

### Updating Trade Data

1. Upload a new CSV file to your Vercel Blob storage
2. Update the `TRADE_DATA_BLOB_URL` environment variable if the URL changes
3. The changes take effect immediately

## Adding Content

### Add a New Company Analysis
1. Go to `app/analyses/`.
2. Add a new markdown file, e.g. `tesla.md`.
3. The file will be accessible at `/analyses/tesla`.

### Add a New Progress Report
1. Go to `app/reports/`.
2. Add a new markdown file, e.g. `q2-2024.md` or `2024-yearly.md`.
3. The file will be accessible at `/reports/q2-2024` or `/reports/2024-yearly`.

## Deployment

This project is ready to deploy on [Vercel](https://vercel.com/).

## Customization
- You can edit the navigation and main page in `app/page.tsx`.
- To add more sections, create new folders and pages in the `app/` directory.

---

**Enjoy your personal portfolio website!**
