# Development Guide

This guide helps developers understand and extend the Personal Portfolio Tracker application.

## Understanding the Application

### Core Concepts

The application is built around several key concepts:

1. **Trade Data Management**: All portfolio data is stored in a PostgreSQL database via Neon
2. **Position Calculation**: The system aggregates buy/sell transactions to determine current holdings
3. **Real-time Valuation**: Current prices are fetched from Yahoo Finance API
4. **Performance Tracking**: Gains are calculated against cost basis with S&P 500 comparison

### Data Flow

Understanding how data moves through the application:

1. Trade data is stored in PostgreSQL database
2. Server-side functions query and process this data
3. Current prices are fetched and cached from external APIs
4. Calculations happen server-side for security and performance
5. Processed data is sent to the client for visualization

### Key Components

**Main Dashboard** (`app/page.tsx`)
- Displays portfolio summary cards
- Shows current holdings table
- Renders performance charts
- Lists exited positions

**API Layer** (`app/api/`)
- `/portfolio` - Returns processed portfolio data
- `/stock-price` - Fetches current stock prices
- `/exchange-rate` - Handles currency conversion
- `/portfolio-history` - Provides historical data for charts
- `/news` - Fetches AI-powered news analysis using Gemini API

**Data Processing** (`lib/`)
- `portfolio.ts` - Position calculation and portfolio logic
- `financial-calculations.ts` - CAGR and performance metrics
- `db.ts` - Database connection management
- `trade-data-cache.ts` - Trade data access layer

## Development Workflow

### Setting Up Your Environment

1. Clone the repository and install dependencies
2. Create `.env.local` with required environment variables
3. Ensure you have access to the PostgreSQL database
4. Run the development server to verify setup

### Understanding the Codebase

Start by exploring these key files:
- `app/page.tsx` - Main application entry point
- `lib/portfolio.ts` - Core data processing logic
- `types/portfolio.ts` - TypeScript interfaces
- `lib/constants.ts` - Configuration values

### Making Changes

The application follows these patterns:

**Adding New Features**
1. Identify where the feature fits in the architecture
2. Create new files following existing naming conventions
3. Implement server-side logic in API routes or lib functions
4. Add client-side components for UI
5. Update types as needed

**Modifying Existing Features**
1. Trace the data flow from source to display
2. Identify all files that need updates
3. Maintain backward compatibility where possible
4. Update related documentation

### Common Development Tasks

**Adding a New Metric**
1. Add calculation logic to `lib/financial-calculations.ts`
2. Update portfolio processing in `lib/portfolio.ts`
3. Add the metric to API responses
4. Display in the UI components

**Creating a New Chart**
1. Create component in `components/`
2. Use existing chart components as reference
3. Connect to data from API routes
4. Add to relevant pages

**Adding a New Report Type**
1. Create new folder in `app/reports/`
2. Implement page component
3. Add data processing if needed
4. Update navigation

## Architecture Decisions

### Why CSV Storage?

The application uses CSV files in Blob storage instead of a database because:
- Simple to update manually
- No database maintenance required
- Easy to backup and version
- Sufficient for single-user application

### Caching Strategy

The application implements multiple caching layers:
- Build-time: Portfolio compositions pre-calculated
- Runtime: API responses cached in memory
- Client-side: Browser caching for static assets

### Server-Side Processing

All sensitive calculations happen server-side:
- Protects trade data from client exposure
- Enables secure API key usage
- Improves performance with caching
- Allows for future multi-user support

## Testing Your Changes

### Manual Testing

1. Verify data displays correctly
2. Check responsive design on mobile
3. Test error states with invalid data
4. Ensure performance remains acceptable

### Key Test Scenarios

- Empty portfolio state
- Single currency portfolios
- Multi-currency with conversions
- Historical data edge cases
- API failure handling

## Performance Considerations

### Optimization Points

- Minimize API calls with intelligent caching
- Pre-calculate data at build time where possible
- Use React.memo for expensive components
- Implement proper loading states

### Monitoring Performance

- Check build times remain reasonable
- Monitor API response times
- Verify client-side bundle sizes
- Test on slower connections

## Debugging Tips

### Common Issues

**Data Not Updating**
- Check cache expiration in constants
- Verify Blob storage connection
- Ensure CSV format is correct

**Calculation Errors**
- Trace through portfolio.ts processing
- Verify exchange rate conversions
- Check date parsing logic

**UI Issues**
- Inspect component props
- Check responsive breakpoints
- Verify data structure matches expectations

### Useful Debugging Tools

- Browser DevTools for client-side debugging
- Vercel Functions logs for API issues
- TypeScript compiler for type errors
- Network tab for API call inspection

## Contributing Guidelines

### Code Standards

- Maintain TypeScript strict mode
- Follow existing file organization
- Use meaningful variable names
- Add comments for complex logic

### Before Submitting Changes

1. Test all affected features
2. Update relevant documentation
3. Ensure no TypeScript errors
4. Check responsive design
5. Verify performance impact

### Pull Request Process

1. Create feature branch from main
2. Make focused, logical commits
3. Write clear PR description
4. Link related issues
5. Respond to review feedback

## Next Steps

After familiarizing yourself with the codebase:

1. Pick a small feature or bug to start
2. Study similar existing implementations
3. Ask questions if architecture is unclear
4. Contribute improvements to documentation
5. Share ideas for new features

The application is designed to be extended. Key areas for enhancement include:
- Advanced analytics and insights
- Additional chart types
- Export functionality
- Performance optimizations
- Mobile app development

Happy coding!