# Personal Portfolio Website

This is a simple Next.js-based personal website to track your portfolio, company analyses, progress reports, and more.

## Features

- **Main Page:** Shows your portfolio value (with a placeholder for a graph).
- **Analyses:** Store and view markdown files for different company analyses.
- **Reports:** Store and view markdown files for quarterly and yearly progress reports.
- **About:** Simple about page.

## Trade Data Storage

The portfolio trade data is stored in Vercel Blob storage. The application reads the CSV file directly from the blob URL:
- Blob URL: `https://vdfsglfxeuhocbce.public.blob.vercel-storage.com/TradeData/TradeHistory-W2MjQv93Q7uN12MlNIH8MVx9Vf70R7.csv`
- No local file storage is required
- The data is fetched on-demand when portfolio calculations are performed

To update the trade data:
1. Upload a new CSV file to your Vercel Blob storage
2. Update the `TRADE_DATA_BLOB_URL` constant in `lib/constants.ts` or set it as an environment variable

The blob URL is centrally configured in `lib/constants.ts` and used across all API routes that need to access the trade data.

### Security Considerations

**Important**: The current setup uses a public blob URL which could be discovered by users through browser developer tools. If your trade data is sensitive:

1. **Use Environment Variables**: Set `TRADE_DATA_BLOB_URL` in your Vercel environment variables instead of hardcoding it
2. **Consider Private Blobs**: For enhanced security, consider using Vercel Blob's authenticated access with read tokens
3. **Monitor Access**: The blob URL is unguessable but public. Monitor your Vercel Blob dashboard for unexpected access

To use environment variables:
```bash
# In your Vercel dashboard or .env.local file
TRADE_DATA_BLOB_URL=your-blob-url-here
```

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
