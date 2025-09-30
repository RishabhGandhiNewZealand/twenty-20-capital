# Time-Weighted Returns Implementation

## Overview

The portfolio performance graph now uses **Time-Weighted Returns (TWR)** to accurately measure portfolio performance independent of cash flow timing.

## Why Time-Weighted Returns?

### The Two Main Return Calculation Methods

#### 1. **Money-Weighted Return (MWR)** - Also known as Internal Rate of Return (IRR)
- **Measures**: How well YOU did with your timing decisions
- **Accounts for**: The size and timing of your cash flows
- **Best for**: Evaluating your overall investment decision including when you added/withdrew money
- **Example**: If you invested $1,000 before a market surge and another $9,000 before a crash, MWR will show poor performance because most of your money was invested at the wrong time

#### 2. **Time-Weighted Return (TWR)** - Industry Standard
- **Measures**: How well your PORTFOLIO/STRATEGY performed
- **Eliminates**: The impact of when you added or withdrew money
- **Best for**: Comparing portfolio/manager performance, evaluating investment selection
- **Example**: Using the same scenario above, TWR would show good performance because it measures the portfolio's actual investment gains, not your timing

### Why We Use TWR

For a portfolio tracker, **Time-Weighted Return is the right choice** because:

1. **Fair Comparison**: You can accurately compare your performance to benchmarks (like S&P 500)
2. **Measures Skill**: Shows how well your stock picks performed, independent of cash flow timing
3. **Industry Standard**: Professional fund managers are evaluated using TWR
4. **Eliminates Noise**: Cash flows (adding $500 here, $1000 there) don't distort your returns

## How TWR Works

### Calculation Method

TWR works by:

1. **Breaking the period into sub-periods** between cash flows
2. **Calculating returns for each sub-period**: 
   ```
   Daily Return = (End Value - Start Value - Cash Flow) / Start Value
   ```
3. **Linking the returns together**:
   ```
   Cumulative Return = (1 + R₁) × (1 + R₂) × ... × (1 + Rₙ) - 1
   ```

### Example Calculation

Let's say you:
- Day 1: Invest $1,000, value = $1,000
- Day 30: Portfolio grows to $1,100 (10% return)
- Day 30: Add $500 more, total invested = $1,500
- Day 60: Portfolio worth $1,700

**TWR Calculation:**
- Period 1 (Day 1-30): Return = ($1,100 - $1,000) / $1,000 = 10%
- Period 2 (Day 30-60): Return = ($1,700 - $1,600 - $500) / $1,600 = 6.25%
  - Note: We subtract the $500 cash flow because it didn't "grow"
- Cumulative TWR = (1.10) × (1.0625) - 1 = 16.875%

**Simple Return (for comparison):**
- Would show: ($1,700 - $1,500) / $1,500 = 13.33%
- This is misleading because it doesn't account for the timing of the $500 addition

## Implementation Details

### File Structure

1. **`/workspace/lib/portfolioCalculations_v2.ts`**
   - Core TWR calculation engine
   - Processes daily holdings and cash flows
   - Links daily returns into cumulative performance

2. **`/workspace/components/portfolio-chart.tsx`**
   - Displays TWR data in an interactive chart
   - Shows both absolute values and percentage returns
   - Compares portfolio TWR vs S&P 500 TWR

3. **`/workspace/lib/portfolio-cache-service.ts`**
   - Caches TWR calculations for performance
   - Automatically imports the new calculation module

### Key Features

#### 1. **Cash Flow Handling**
```typescript
// Positive for buys (new capital)
// Negative for sells (capital withdrawal)
// Zero for reinvestments (no new capital)
const dailyCashFlow = cashFlowsByDate.get(dateStr) || 0
```

#### 2. **Daily Return Calculation**
```typescript
if (previousPortfolioValue > 0) {
  const dailyReturn = (portfolioValue - previousPortfolioValue - dailyCashFlow) / previousPortfolioValue
  portfolioReturnMultiplier *= (1 + dailyReturn)
}
```

#### 3. **S&P 500 Benchmark**
- Buys/sells SPY shares with each cash flow at that day's price
- Applies the same TWR methodology
- Ensures fair comparison (same cash flow timing)

### Data Structure

```typescript
interface DailyPortfolioData {
  date: string
  portfolioValue: number      // Total portfolio value
  portfolioReturn: number      // Cumulative TWR %
  sp500Value: number          // Equivalent S&P 500 investment
  sp500Return: number         // S&P 500 TWR %
  cashFlows: number           // Daily net cash flow
  totalInvested: number       // Cumulative invested capital
}
```

## Benefits of This Approach

### 1. **Accurate Performance Measurement**
- Your 20% return means you actually grew your investments by 20%
- Not influenced by whether you invested $100 or $10,000 on any given day

### 2. **Fair Benchmark Comparison**
- S&P 500 comparison uses the SAME cash flow dates and amounts
- Shows true outperformance/underperformance

### 3. **Transparent Tracking**
- Can see exact cash flow impact in the data
- Total invested is tracked separately for reference

### 4. **Industry Standard**
- Aligns with how professional investors measure performance
- Makes your results comparable to fund managers, advisors, etc.

## Visual Representation

The chart shows:

1. **Value View**
   - Portfolio Value (green line)
   - S&P 500 Value (gray line)
   - Total Invested (red dashed line)

2. **Return View** (Default)
   - Portfolio Return % (green line)
   - S&P 500 Return % (gray line)
   - Zero line for reference (gray dashed)

## Comparison: Old vs New Approach

### Old Approach (Cost Basis)
```
Return = (Current Value - Cost Basis) / Cost Basis
```
- Problem: Cost basis changes with every buy, making returns inconsistent
- Your $500 addition issue: Cost basis jumped but returns didn't reflect true performance

### New Approach (TWR)
```
Return = Product of daily returns, excluding cash flow impact
```
- Solution: Each day's return is calculated independently of cash flows
- Your $500 addition: Properly excluded from return calculation, shows true portfolio growth

## Testing the Fix

After implementing TWR:

✅ **Your $500 addition** now correctly shows as new capital
✅ **Returns are consistent** before and after cash flows
✅ **Benchmark comparison** is fair and meaningful
✅ **Performance measurement** reflects your investment selection skill

## Future Enhancements

Potential additions:
1. **Annualized Returns**: Convert cumulative returns to annualized %
2. **Sharpe Ratio**: Risk-adjusted performance metric
3. **Maximum Drawdown**: Largest peak-to-trough decline
4. **Volatility**: Standard deviation of returns

## References

- [Investopedia: Time-Weighted Return](https://www.investopedia.com/terms/t/time-weightedror.asp)
- [Investopedia: Money-Weighted Return](https://www.investopedia.com/terms/m/money-weighted-return.asp)
- [CFA Institute: Performance Measurement](https://www.cfainstitute.org/en/membership/professional-development/refresher-readings/return-calculation)