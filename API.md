# API Documentation

This document provides detailed information about all API endpoints available in the Personal Portfolio Tracker application.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

Currently, all API endpoints are public and do not require authentication. In production, these endpoints are protected by Vercel's edge network and environment variables.

## Endpoints

### Portfolio Data

#### GET `/api/portfolio`

Retrieves complete portfolio data including current holdings and exited positions.

**Response:**

```json
{
  "holdings": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "shares": 100,
      "currentPrice": 195.89,
      "currentValueNZD": 31742.45,
      "costBasisNZD": 25000.00,
      "gainNZD": 6742.45,
      "gainPercent": 26.97,
      "allocation": 15.5,
      "currency": "USD"
    }
  ],
  "exitedPositions": [
    {
      "symbol": "TSLA",
      "name": "Tesla Inc.",
      "entryDate": "2023-01-15",
      "exitDate": "2024-06-20",
      "costBasisNZD": 15000.00,
      "exitValueNZD": 18500.00,
      "gainNZD": 3500.00,
      "gainPercent": 23.33
    }
  ],
  "lastUpdated": "2024-01-20T10:30:00.000Z"
}
```

**Error Responses:**

- `500`: Failed to generate portfolio data

---

### Current Portfolio Value

#### GET `/api/portfolio-current`

Retrieves current portfolio summary including total value, gains, and S&P 500 comparison.

**Response:**

```json
{
  "summary": {
    "totalValueNZD": 204850.32,
    "totalCostBasisNZD": 150000.00,
    "totalGainNZD": 54850.32,
    "totalGainPercent": 36.57,
    "sp500Value": 180000.00,
    "sp500GainNZD": 30000.00,
    "sp500GainPercent": 20.00,
    "exchangeRate": 0.62
  },
  "holdings": [...],
  "exitedPositions": [...]
}
```

**Error Responses:**

- `500`: Failed to fetch portfolio data

---

### Portfolio History

#### GET `/api/portfolio-history`

Retrieves historical portfolio data for charting purposes.

**Response:**

```json
{
  "history": [
    {
      "date": "2024-01-01",
      "portfolioValue": 195000.00,
      "totalCostBasis": 150000.00,
      "sp500Value": 175000.00,
      "dailyGain": 1250.00,
      "dailyGainPercent": 0.64
    }
  ]
}
```

**Error Responses:**

- `500`: Failed to generate portfolio history

---

### Portfolio Composition

#### GET `/api/portfolio-composition`

Retrieves cached portfolio composition data for performance optimization.

**Response:**

```json
{
  "compositions": {
    "2024-01-20": {
      "holdings": {
        "AAPL": { "value": 31742.45, "percentage": 15.5 },
        "GOOGL": { "value": 45230.12, "percentage": 22.1 }
      },
      "totalValue": 204850.32
    }
  },
  "lastUpdated": "2024-01-20T10:00:00.000Z"
}
```

**Error Responses:**

- `500`: Failed to read portfolio compositions

---

### Stock Price

#### GET `/api/stock-price?symbol={symbol}`

Retrieves real-time stock price for a given symbol.

**Query Parameters:**

- `symbol` (required): Stock ticker symbol (e.g., AAPL, GOOGL)

**Response:**

```json
{
  "symbol": "AAPL",
  "price": 195.89,
  "currency": "USD",
  "marketState": "REGULAR",
  "regularMarketTime": "2024-01-20T16:00:00.000Z",
  "regularMarketPrice": 195.89,
  "regularMarketDayHigh": 196.50,
  "regularMarketDayLow": 194.25,
  "regularMarketVolume": 45678900,
  "regularMarketPreviousClose": 194.50,
  "regularMarketOpen": 195.00,
  "fiftyTwoWeekHigh": 199.62,
  "fiftyTwoWeekLow": 164.08
}
```

**Error Responses:**

- `400`: Symbol parameter is required
- `404`: Stock symbol not found
- `500`: Failed to fetch stock price

---

### Exchange Rate

#### GET `/api/exchange-rate?from={currency}&to={currency}`

Retrieves current exchange rate between two currencies.

**Query Parameters:**

- `from` (optional): Source currency code (default: USD)
- `to` (optional): Target currency code (default: NZD)

**Response:**

```json
{
  "from": "USD",
  "to": "NZD",
  "rate": 1.6129,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

**Error Responses:**

- `404`: Exchange rate not found
- `500`: Failed to fetch exchange rate

---

## Rate Limiting

API endpoints implement caching to reduce external API calls:

- Stock prices: Cached for 5 minutes
- Exchange rates: Cached for 1 hour
- Portfolio data: Generated on-demand from blob storage

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

Common error codes:

- `INVALID_PARAMETER`: Missing or invalid request parameters
- `NOT_FOUND`: Requested resource not found
- `EXTERNAL_API_ERROR`: External API (Yahoo Finance) error
- `STORAGE_ERROR`: Vercel Blob storage error
- `INTERNAL_ERROR`: Unexpected server error

## Data Sources

- **Portfolio Data**: Stored in Vercel Blob storage as CSV
- **Stock Prices**: Real-time data from Yahoo Finance API
- **Exchange Rates**: Real-time data from Yahoo Finance API

## Caching Strategy

The application implements several caching mechanisms:

1. **Build-time Caching**: Portfolio compositions are pre-calculated during build
2. **Runtime Caching**: Stock prices and exchange rates are cached in memory
3. **Client-side Caching**: React Query or SWR can be used for client-side caching

## Usage Examples

### Fetch Portfolio Data

```javascript
async function getPortfolio() {
  const response = await fetch('/api/portfolio');
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio');
  }
  return response.json();
}
```

### Get Stock Price

```javascript
async function getStockPrice(symbol) {
  const response = await fetch(`/api/stock-price?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stock price');
  }
  return response.json();
}
```

### Convert Currency

```javascript
async function convertCurrency(amount, from = 'USD', to = 'NZD') {
  const response = await fetch(`/api/exchange-rate?from=${from}&to=${to}`);
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rate');
  }
  const { rate } = await response.json();
  return amount * rate;
}
```

## Future Enhancements

- [ ] Add authentication and user-specific portfolios
- [ ] Implement WebSocket support for real-time updates
- [ ] Add historical price data endpoints
- [ ] Support for cryptocurrency prices
- [ ] Batch stock price requests
- [ ] GraphQL API support