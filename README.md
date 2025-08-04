# Personal Portfolio Tracker

A portfolio tracking application built with Next.js 15, TypeScript, and Tailwind CSS that provides real-time investment monitoring, performance analytics, and comprehensive reporting capabilities.

## Application Overview

This application serves as a personal investment portfolio tracker with the following core functionalities:

- Real-time portfolio valuation with live market data integration
- Multi-currency support with automatic conversion to NZD
- Performance tracking against S&P 500 benchmark
- Company-specific analysis pages with markdown support
- Quarterly and yearly progress reporting
- Responsive design optimized for both desktop and mobile

## Architecture

The application follows Next.js 15's App Router architecture with server-side rendering for optimal performance. Key architectural decisions include:

- **Data Storage**: Trade data is stored in CSV format on Vercel Blob storage, allowing easy updates without database complexity
- **API Integration**: Yahoo Finance API provides real-time stock prices and exchange rates
- **Caching Strategy**: Build-time caching for portfolio compositions and runtime caching for market data
- **Component Architecture**: Modular React components using shadcn/ui for consistent UI patterns

## Project Structure

The codebase is organized into logical modules:

- `app/` - Next.js pages and API routes using the App Router pattern
- `components/` - Reusable React components including charts and UI elements
- `lib/` - Core business logic, utilities, and data processing functions
- `hooks/` - Custom React hooks for common functionality
- `types/` - TypeScript type definitions ensuring type safety throughout
- `scripts/` - Build-time scripts for data preprocessing

## Key Features and Implementation

### Portfolio Management
The main dashboard (`app/page.tsx`) displays current holdings, performance metrics, and portfolio composition. Data flows from CSV storage through server-side processing to client-side visualization.

### Data Processing
Trade data is parsed from CSV format (`lib/portfolio.ts`) with support for multiple currencies and transaction types. The system calculates current positions by aggregating all buy/sell transactions.

### Real-time Updates
API routes in `app/api/` handle fetching current market prices and exchange rates, with intelligent caching to minimize external API calls while maintaining data freshness.

### Visualization
Portfolio performance is visualized using Recharts with custom components for line charts and horizontal bar charts showing allocation percentages.

## Development Setup

To work on this application, you'll need:

1. Node.js 18.17 or later
2. A Vercel account for blob storage
3. Access to the trade data CSV format specification

Environment variables required:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage authentication
- `TRADE_DATA_BLOB_URL` - URL to your trade data CSV file
- `GEMINI_API_KEY` - Google Gemini API key for AI-powered news analysis (optional, only needed for News feature)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Blob storage URL for trade data CSV (required)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Google Gemini API key for AI-powered news analysis (required for news feature)
GEMINI_API_KEY=your_gemini_api_key_here
```

## Extending the Application

### Adding New Features

The modular architecture makes it straightforward to add new capabilities:

- **New API Endpoints**: Add route handlers in `app/api/`
- **Additional Charts**: Create components in `components/` following existing patterns
- **New Report Types**: Add pages in `app/reports/` with corresponding data processing
- **Enhanced Analytics**: Extend calculations in `lib/financial-calculations.ts`

### Data Model

The application processes trade data with the following structure:
- Stock transactions (buy/sell) with prices in original currency
- Automatic currency conversion to NZD
- Position tracking across multiple exchanges
- Historical performance calculation

### Customization Points

- Company color mappings in `lib/company-colors.ts`
- Financial constants in `lib/constants.ts`
- Chart configurations in component files
- Theme customization via Tailwind CSS configuration

## Performance Considerations

The application implements several performance optimizations:

- Server-side rendering for initial page loads
- Pre-calculated portfolio compositions at build time
- Efficient caching strategies for market data
- Lazy loading for heavy components
- Responsive image optimization

## Deployment

The application is designed for deployment on Vercel with:

- Automatic builds triggered by git pushes
- Edge function support for API routes
- Blob storage integration for data persistence
- Built-in analytics and monitoring

## Next Steps

To continue development:

1. Review the existing codebase structure in `ARCHITECTURE.md`
2. Understand component patterns in `COMPONENTS.md`
3. Check API documentation in `API.md`
4. Follow development guidelines in `DEVELOPMENT.md`

The application provides a solid foundation for portfolio tracking with room for enhancement in areas like:
- Multi-user support
- Advanced analytics and reporting
- Mobile app development
- Real-time WebSocket updates
- Integration with additional data sources

---

For detailed technical documentation, refer to the other documentation files in this repository.
