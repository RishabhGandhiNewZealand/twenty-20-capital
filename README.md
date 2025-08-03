# Personal Portfolio Tracker

A modern, feature-rich portfolio tracking application built with Next.js 15, TypeScript, and Tailwind CSS. Track your investments, analyze companies, and monitor your portfolio performance with real-time data and beautiful visualizations.

## Features

### Portfolio Management
- **Real-time Portfolio Tracking**: Monitor your holdings with live price updates
- **Performance Analytics**: Track gains/losses, CAGR, and compare against S&P 500
- **Visual Dashboards**: Interactive charts showing portfolio composition and performance
- **Multi-currency Support**: Handle investments in different currencies with automatic conversion

### Company Analysis
- **Detailed Company Pages**: Store and view in-depth analyses for different companies
- **Markdown Support**: Write analyses in Markdown with full formatting support
- **Company-specific Coloring**: Automatic brand color theming for each company

### Reporting
- **Progress Reports**: Create quarterly and yearly investment reports
- **Performance History**: Track portfolio evolution over time
- **Export Capabilities**: Generate reports in various formats

### User Experience
- **Responsive Design**: Fully optimized for desktop and mobile devices
- **Dark Mode Support**: Built-in theme switching with system preference detection
- **Modern UI**: Clean, intuitive interface built with shadcn/ui components

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Data Storage**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Market Data**: [Yahoo Finance API](https://github.com/gadicc/node-yahoo-finance2)
- **Deployment**: [Vercel](https://vercel.com/)

## Prerequisites

- Node.js 18.17 or later
- npm or pnpm package manager
- Vercel account (for blob storage)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Vercel Blob Storage (required)
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx
   TRADE_DATA_BLOB_URL=https://your-store-id.public.blob.vercel-storage.com/path/to/trade-data.csv
   ```

4. **Prepare your trade data**
   
   Upload a CSV file with your trade data to Vercel Blob storage. The CSV should follow this format:
   ```csv
   Code,Market Code,Name,Buy/Sell,Quantity,Price,Exchange Rate,Brokerage,Date,Total (Local),Total (NZD),Currency
   AAPL,NASDAQ,Apple Inc.,Buy,10,150.00,0.62,5.00,2024-01-15,1505.00,2427.42,USD
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your portfolio.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── portfolio/     # Portfolio data endpoints
│   │   ├── stock-price/   # Real-time stock prices
│   │   └── exchange-rate/ # Currency conversion
│   ├── analyses/          # Company analysis pages
│   ├── reports/           # Portfolio reports
│   ├── about/            # About page
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── portfolio-chart.tsx
│   └── app-sidebar.tsx
├── lib/                   # Utility functions
│   ├── portfolio.ts      # Portfolio calculations
│   ├── blob-utils.ts     # Vercel Blob utilities
│   └── constants.ts      # App constants
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── scripts/              # Build and utility scripts
└── styles/               # Global styles
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (auto-set by Vercel) | `vercel_blob_rw_xxx...` |
| `TRADE_DATA_BLOB_URL` | URL to your trade data CSV in Blob storage | `https://xxx.blob.vercel-storage.com/trades.csv` |

### Getting Blob Storage Credentials

1. Go to your Vercel Dashboard
2. Navigate to Storage → Create a Blob Store
3. Copy the read/write token from the Tokens section
4. Upload your trade data CSV and copy its URL

## Trade Data Format

Your trade data CSV must include these columns:

- **Code**: Stock ticker symbol (e.g., AAPL)
- **Market Code**: Exchange identifier (e.g., NASDAQ)
- **Name**: Company name
- **Buy/Sell**: Transaction type
- **Quantity**: Number of shares
- **Price**: Price per share in local currency
- **Exchange Rate**: Conversion rate to NZD
- **Brokerage**: Transaction fees
- **Date**: Transaction date (YYYY-MM-DD)
- **Total (Local)**: Total value in local currency
- **Total (NZD)**: Total value in NZD
- **Currency**: Transaction currency (e.g., USD)

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Set up Blob Storage**
   - In Vercel Dashboard, go to Storage
   - Create a new Blob store
   - Upload your trade data CSV
   - Update environment variables with the blob URL

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Cache portfolio compositions (runs automatically on build)
npm run cache-compositions
```

## Adding Content

### Company Analyses

1. Create a new folder in `app/analyses/[company-name]/`
2. Add a `page.mdx` file with your analysis
3. The analysis will be available at `/analyses/[company-name]`

Example structure:
```
app/analyses/
├── apple/
│   └── page.mdx
├── tesla/
│   └── page.mdx
└── page.tsx          # Analyses index
```

### Progress Reports

1. Create a new folder in `app/reports/[report-name]/`
2. Add a `page.mdx` file with your report
3. The report will be available at `/reports/[report-name]`

Example structure:
```
app/reports/
├── 2024-review/
│   └── page.mdx
├── q1-2025/
│   └── page.mdx
└── page.tsx          # Reports index
```

## Customization

### Theme Configuration

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other theme variables */
}
```

### Company Colors

Add company-specific colors in `lib/company-colors.ts`:

```typescript
export const companyColors = {
  'AAPL': { bg: '#f5f5f7', fg: '#1d1d1f', name: 'Apple' },
  // Add more companies
}
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error handling

### Component Development

```typescript
// Example component structure
import { cn } from "@/lib/utils"

interface ComponentProps {
  className?: string
  // other props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn("default-classes", className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch portfolio data"**
   - Check your `BLOB_READ_WRITE_TOKEN` is correct
   - Verify the CSV file exists at `TRADE_DATA_BLOB_URL`
   - Ensure CSV format matches the required structure

2. **"Exchange rate not found"**
   - The app caches exchange rates; wait a moment and refresh
   - Check your internet connection for API access

3. **Build errors**
   - Clear `.next` folder: `rm -rf .next`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npx tsc --noEmit`

## License

This project is private and proprietary.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## Support

For issues or questions, please open an issue in the GitHub repository.

---

Built with Next.js and Vercel
