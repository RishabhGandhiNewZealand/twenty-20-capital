# Portfolio Matrix API Documentation

## Overview

The Portfolio Matrix API provides a comprehensive view of all portfolio data in a structured matrix format. This endpoint aggregates trades, holdings, performance metrics, and capital flow information into a single response.

## Endpoint

```
GET /api/portfolio-matrix
```

## Response Structure

### Success Response

```json
{
  "success": true,
  "matrix": {
    "metadata": {...},
    "trades": [...],
    "holdings": [...],
    "performance": {...},
    "capitalFlow": {...},
    "dailySnapshots": [...]
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Matrix Components

### 1. Metadata

Contains general information about the portfolio and the generated report:

```typescript
{
  generatedAt: string,        // ISO timestamp of when the matrix was generated
  exchangeRate: number,       // Current USD/NZD exchange rate
  totalTrades: number,        // Total number of trades in history
  uniqueSymbols: number,      // Number of unique stocks traded
  dateRange: {
    start: string,            // First trade date (YYYY-MM-DD)
    end: string              // Last trade date (YYYY-MM-DD)
  }
}
```

### 2. Trades Matrix

Array of all trades with calculated capital flow information:

```typescript
{
  date: string,               // Trade date (YYYY-MM-DD)
  type: string,               // 'Buy' | 'Sell' | 'Reinvestment'
  symbol: string,             // Stock symbol
  quantity: number,           // Number of shares
  price: number,              // Price per share
  currency: string,           // 'USD' or 'NZD'
  valueLocal: number,         // Trade value in original currency
  valueNZD: number,           // Trade value in NZD
  runningCostBasis: number,   // Cumulative cost basis after this trade
  runningCapitalPool: number, // Available capital from sells
  isNewCapital: boolean,      // Whether this required new capital
  newCapitalAmount: number    // Amount of new capital added (if any)
}
```

### 3. Holdings Matrix

Current portfolio holdings with performance metrics:

```typescript
{
  symbol: string,                  // Stock symbol
  currentShares: number,           // Current number of shares held
  averageCost: number,             // Average cost per share in NZD
  currentPrice: number,            // Current market price
  currentValueNZD: number,         // Current value in NZD
  unrealizedGainNZD: number,       // Unrealized gain/loss in NZD
  unrealizedGainPercent: number,   // Unrealized gain/loss percentage
  allocation: number,              // Portfolio allocation percentage
  firstPurchaseDate: string,       // Date of first purchase
  lastActivityDate: string         // Date of last trade activity
}
```

### 4. Performance Matrix

Overall portfolio performance metrics:

```typescript
{
  totalValueNZD: number,           // Current portfolio value
  totalCostBasisNZD: number,       // Total invested capital
  totalRealizedGainsNZD: number,   // Realized gains from sold positions
  totalUnrealizedGainsNZD: number, // Unrealized gains from current holdings
  totalGainsNZD: number,           // Total gains (realized + unrealized)
  totalGainsPercent: number,       // Total return percentage
  sp500ValueNZD: number,           // S&P 500 benchmark value
  sp500GainsNZD: number,           // S&P 500 benchmark gains
  sp500GainsPercent: number,       // S&P 500 return percentage
  alphaVsSP500: number             // Outperformance vs S&P 500
}
```

### 5. Capital Flow Matrix

Tracks the flow of capital in and out of the portfolio:

```typescript
{
  totalInvested: number,           // Total new capital invested
  totalWithdrawn: number,          // Total capital from sells
  netCashFlow: number,             // Net cash flow (invested - withdrawn)
  totalDividendsReinvested: number,// Total dividends reinvested
  currentCapitalPool: number,      // Current available capital from sells
  recycledCapital: number          // Capital that has been reinvested
}
```

### 6. Daily Snapshots

Historical snapshots of portfolio performance (simplified for last 30 days):

```typescript
{
  date: string,                    // Snapshot date (YYYY-MM-DD)
  portfolioValueNZD: number,       // Portfolio value on this date
  costBasisNZD: number,            // Cost basis on this date
  sp500ValueNZD: number,           // S&P 500 value on this date
  dailyChangeNZD: number,          // Daily change in NZD
  dailyChangePercent: number       // Daily change percentage
}
```

## Usage Examples

### JavaScript/TypeScript

```javascript
// Fetch portfolio matrix
const response = await fetch('/api/portfolio-matrix');
const data = await response.json();

if (data.success) {
  const { matrix } = data;
  
  // Access performance metrics
  console.log(`Total Value: NZ$${matrix.performance.totalValueNZD}`);
  console.log(`Total Return: ${matrix.performance.totalGainsPercent}%`);
  
  // Access current holdings
  matrix.holdings.forEach(holding => {
    console.log(`${holding.symbol}: ${holding.allocation.toFixed(2)}%`);
  });
  
  // Check capital flow
  console.log(`New Capital: NZ$${matrix.capitalFlow.totalInvested}`);
  console.log(`Recycled: NZ$${matrix.capitalFlow.recycledCapital}`);
}
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/api/portfolio-matrix')
data = response.json()

if data['success']:
    matrix = data['matrix']
    
    # Performance summary
    perf = matrix['performance']
    print(f"Portfolio Value: NZ${perf['totalValueNZD']:.2f}")
    print(f"Total Return: {perf['totalGainsPercent']:.2f}%")
    print(f"Alpha vs S&P 500: {perf['alphaVsSP500']:.2f}%")
    
    # Top holdings
    for holding in matrix['holdings'][:5]:
        print(f"{holding['symbol']}: {holding['allocation']:.2f}%")
```

## Key Features

1. **Capital Tracking**: Distinguishes between new capital and recycled capital from sells
2. **Performance Metrics**: Includes both realized and unrealized gains
3. **Benchmark Comparison**: Tracks S&P 500 performance with same investment timing
4. **Historical Context**: Provides trade history with running calculations
5. **Current Snapshot**: Real-time portfolio composition and valuations

## Notes

- Exchange rates are fetched in real-time from Yahoo Finance
- S&P 500 benchmark uses SPY ETF as a proxy
- All values are converted to NZD for consistency
- The API respects the capital flow rules:
  - Cost basis only increases with new capital
  - Sells create a pool of available capital for reinvestment
  - Reinvestments (dividends) don't affect cost basis

## Testing

To test the API endpoint:

```bash
# Run the test script (requires Next.js server running)
node scripts/test-matrix-api.js
```

Or use curl:

```bash
curl http://localhost:3000/api/portfolio-matrix | jq
```

## Cache Behavior

The underlying trade data is cached for 1 hour. The portfolio matrix itself is generated fresh on each request to ensure current prices and calculations are accurate.