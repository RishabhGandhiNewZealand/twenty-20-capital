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
- The blob pathname is configured in `lib/constants.ts`
- All data fetching happens server-side using the SDK

### Vercel Blob Setup

When you create a Blob store in Vercel and connect it to your project, Vercel automatically:
1. Creates a `BLOB_READ_WRITE_TOKEN` environment variable
2. Makes it available to your application at runtime
3. The `@vercel/blob` SDK uses this token automatically

### Local Development Setup

For local development, you need to set the token manually:
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → Select your Blob store
3. Go to the **Tokens** tab
4. Copy the read/write token
5. Create a `.env.local` file with:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx
   ```

### Security Features

- ✅ **Authenticated access**: Uses Vercel's blob tokens for secure access
- ✅ **Server-side only**: All blob operations happen in API routes
- ✅ **No URLs exposed**: The blob URLs are never sent to the client
- ✅ **SDK handles auth**: Authentication is handled automatically by the SDK

### Updating Trade Data

1. Upload a new CSV file to your Vercel Blob storage with the same pathname
2. Or update the `TRADE_DATA_BLOB_PATHNAME` in `lib/constants.ts` if using a different file
3. The changes take effect immediately

### Trade Data File Location

The current trade data file is located at:
- **Blob pathname:** `TradeData/TradeHistory-W2MjQv93Q7uN12MlNIH8MVx9Vf70R7.csv`
- This can be changed in `lib/constants.ts`

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
