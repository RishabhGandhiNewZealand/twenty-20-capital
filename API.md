# API Documentation

This document describes the API endpoints available in the Personal Portfolio Tracker application.

## API Architecture

The application uses Next.js API routes to provide a backend API that:

- Processes portfolio data from CSV storage
- Fetches real-time market data from external sources
- Implements caching to optimize performance
- Handles all sensitive operations server-side

All API routes are located in `app/api/` and follow RESTful conventions.

## Available Endpoints

### Portfolio Data

#### GET `/api/portfolio`

Returns complete portfolio data including current holdings and exited positions. This endpoint:

- Reads trade data from Vercel Blob storage
- Calculates current positions by aggregating transactions
- Fetches current market prices for each holding
- Computes gains/losses and performance metrics
- Returns both active holdings and exited positions

The response includes holdings with current values, cost basis, gains, and allocation percentages, plus a list of previously exited positions with their realized gains.

### Current Portfolio Summary

#### GET `/api/portfolio-current`

Provides a real-time summary of the portfolio including:

- Total portfolio value in NZD
- Overall gains/losses compared to cost basis
- S&P 500 benchmark comparison
- Current exchange rates
- Detailed holdings information

This endpoint is optimized for the main dashboard display and includes all calculations needed for the summary cards and charts.

### Portfolio History

#### GET `/api/portfolio-history`

Returns historical portfolio data for charting purposes. This endpoint:

- Generates daily portfolio values over time
- Calculates historical cost basis progression
- Provides S&P 500 comparison data
- Includes daily gain/loss calculations

The data is structured for direct consumption by the portfolio chart component.

### Portfolio Composition

#### GET `/api/portfolio-composition`

Retrieves pre-calculated portfolio composition data. This endpoint:

- Returns cached composition data from build time
- Provides allocation percentages by date
- Optimizes performance by avoiding runtime calculations
- Used for historical allocation analysis

### Stock Prices

#### GET `/api/stock-price?symbol={symbol}`

Fetches real-time stock price for a given symbol. Features:

- Integrates with Yahoo Finance API
- Implements 5-minute caching to reduce API calls
- Returns comprehensive price data including day's range
- Handles error cases gracefully

Query parameter `symbol` is required and should be a valid stock ticker.

### Exchange Rates

#### GET `/api/exchange-rate?from={currency}&to={currency}`

Provides currency exchange rates with:

- Default conversion from USD to NZD
- Support for any currency pair
- 1-hour caching for rate stability
- Fallback rates for offline scenarios

Both query parameters are optional and default to USD→NZD conversion.

### News Analysis

#### GET /api/news/companies
Returns the list of portfolio companies and analysis date range.

**Response:**
```json
{
  "companies": ["Company A", "Company B", ...],
  "analysis_period": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
  },
  "report_generated_date": "YYYY-MM-DD"
}
```

#### GET /api/news/company
Analyzes news for a single company. Uses Edge Config cache if available.

**Query Parameters:**
- `company` (required): Company name to analyze
- `refresh` (optional): Set to "true" to skip cache and force fresh analysis

**Response:**
```json
{
  "company_name": "Company Name",
  "status": "news_found" | "no_significant_news_found",
  "summary_points": ["Summary 1", "Summary 2", ...],
  "references": [
    {
      "title": "Article Title",
      "source_name": "Publication",
      "url": "https://...",
      "publication_date": "YYYY-MM-DD",
      "relevance": "direct" | "indirect"
    }
  ],
  "cached": true | false,
  "cache_timestamp": "ISO 8601 timestamp" // Only if cached
}
```

#### POST /api/news/cache
Updates the Edge Config cache with news analysis results.

**Request Body:**
```json
{
  "company": "Company Name",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "data": { /* Company news data */ }
}
```

**Response:**
```json
{
  "success": true | false,
  "cacheKey": "news_company_name_startdate_enddate",
  "cached": true | false,
  "message": "Status message"
}
```

**Note:** Requires `VERCEL_API_TOKEN` environment variable for automatic cache updates.

#### GET /api/news (Deprecated)
The original bulk news analysis endpoint. This endpoint is deprecated due to timeout issues with large portfolios. Use the individual company endpoints above instead.

**Environment Variable Required:**
- `GEMINI_API_KEY`: Your Google Gemini API key (get from https://makersuite.google.com/app/apikey)

**Response includes:**
- Report generation date and analysis period (30 days)
- Company-specific analysis with:
  - Synthesized bullet-point summaries combining multiple sources
  - Comprehensive coverage including indirect market impacts
- References section with:
  - Article titles and direct URLs
  - Source names and publication dates
  - Relevance indicators (direct vs indirect impact)

## Data Flow

### Request Processing

1. Client makes request to API endpoint
2. API route validates request parameters
3. Data is fetched from appropriate source
4. Calculations and transformations applied
5. Response formatted and returned as JSON

### Data Sources

- **Portfolio Data**: Vercel Blob storage (CSV file)
- **Market Prices**: Yahoo Finance API
- **Exchange Rates**: Yahoo Finance API
- **News Analysis**: Google Gemini API
- **Cached Data**: In-memory storage during runtime

### Caching Strategy

The API implements intelligent caching:

- Stock prices: 5-minute cache
- Exchange rates: 1-hour cache
- Portfolio data: On-demand calculation
- Build-time data: Pre-calculated compositions

## Error Handling

All endpoints follow consistent error handling:

- Validation errors return 400 status
- Not found errors return 404 status
- Server errors return 500 status
- All errors include descriptive messages

Error responses include an `error` field with a human-readable message.

## Security Considerations

The API implements several security measures:

- All sensitive data processing happens server-side
- API keys are never exposed to the client
- Environment variables store credentials
- Input validation on all endpoints

## Performance Optimizations

### Caching

Multiple caching strategies reduce external API calls:
- In-memory caching for frequently accessed data
- Build-time pre-calculation for static data
- Appropriate cache durations for different data types

### Efficient Data Processing

- Batch processing where possible
- Minimal data transformations
- Optimized calculations
- Proper error boundaries

## Extending the API

### Adding New Endpoints

To add new API functionality:

1. Create a new route file in `app/api/`
2. Implement the route handler
3. Add appropriate error handling
4. Consider caching requirements
5. Update TypeScript types

### Modifying Existing Endpoints

When changing existing endpoints:

1. Maintain backward compatibility
2. Update response types
3. Consider cache invalidation
4. Test error scenarios
5. Update documentation

## Rate Limiting

The API implements practical rate limiting through:

- Caching to reduce external API calls
- Reasonable cache durations
- Error handling for rate limit scenarios
- Fallback data for critical operations

## Future Enhancements

Potential API improvements include:

- WebSocket support for real-time updates
- GraphQL endpoint for flexible queries
- Batch operations for multiple symbols
- Historical data endpoints
- Advanced analytics endpoints

The API is designed to be extensible while maintaining simplicity and performance for the current single-user use case.

### Environment Variables

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `GEMINI_API_KEY`: Google Gemini API key for news analysis
- `EDGE_CONFIG`: Vercel Edge Config connection string for caching
- `VERCEL_API_TOKEN`: Vercel API token for updating Edge Config (optional)