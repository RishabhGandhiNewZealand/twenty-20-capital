# Personal Portfolio Website

This is a simple Next.js-based personal website to track your portfolio, company analyses, progress reports, and more.

## Features

- **Main Page:** Shows your portfolio value (with a placeholder for a graph).
- **Analyses:** Store and view markdown files for different company analyses.
- **Reports:** Store and view markdown files for quarterly and yearly progress reports.
- **About:** Simple about page.

## Trade Data Storage

The portfolio trade data is stored in Vercel Blob storage and accessed securely server-side only:
- The blob URL is stored as a server-side environment variable
- The URL is NEVER exposed to the client/browser
- All data fetching happens in API routes (server-side)

### Setting up Trade Data Access

1. **Local Development**: Copy `.env.example` to `.env.local` and set your blob URL
2. **Production (Vercel)**: 
   - Go to your Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add `TRADE_DATA_BLOB_URL` with your blob URL
   - **Important**: Do NOT use `NEXT_PUBLIC_` prefix

### Security Features

✅ **Server-side only**: The blob URL is only accessible in API routes, not in client code
✅ **No client exposure**: Users cannot see the blob URL through developer tools
✅ **Environment variable**: Sensitive URL is not hardcoded in the repository
✅ **Generic error messages**: API errors don't expose the blob URL

### Updating Trade Data

1. Upload a new CSV file to your Vercel Blob storage
2. Update the `TRADE_DATA_BLOB_URL` environment variable in Vercel dashboard
3. Redeploy or wait for the environment variable to propagate

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
