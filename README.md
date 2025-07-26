# Personal Portfolio Website

This is a simple Next.js-based personal website to track your portfolio, company analyses, progress reports, and more.

## Features

- **Main Page:** Shows your portfolio value (with a placeholder for a graph).
- **Analyses:** Store and view markdown files for different company analyses.
- **Reports:** Store and view markdown files for quarterly and yearly progress reports.
- **About:** Simple about page.

## Trade Data Storage

The portfolio trade data is stored in Vercel Blob storage:
- The blob URL is hardcoded in `lib/constants.ts`
- Despite being in the repository, the URL is NOT exposed to website visitors
- All data fetching happens server-side in API routes

### How Security Works

Even though the blob URL is in the repository, it remains hidden from website users because:

1. **Server-Side Only**: The URL is only imported and used in API route files (`app/api/*`)
2. **API Routes Run on Server**: Next.js API routes execute on the server, not in the browser
3. **No Client Bundle**: The constant is never imported by client components, so it's not included in the JavaScript sent to browsers
4. **Users Only See API Responses**: Website visitors can only see the JSON responses from your API endpoints, not the implementation details

### Updating Trade Data

1. Upload a new CSV file to your Vercel Blob storage
2. Update the `TRADE_DATA_BLOB_URL` constant in `lib/constants.ts`
3. Commit and deploy the change

### What Users Can See

- ✅ API endpoints like `/api/portfolio-current`
- ✅ JSON responses with portfolio data
- ❌ The actual blob storage URL
- ❌ How the data is fetched

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
