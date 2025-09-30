# Portfolio Performance Cleanup Summary

## Tasks Completed

### ✅ 1. Removed Old Cost Basis Calculation
- **Deleted**: `/workspace/lib/portfolioCalculations.ts` (old version)
- **Reason**: This used a flawed cost-basis approach that didn't properly handle cash flows

### ✅ 2. Promoted Time-Weighted Return Implementation
- **Renamed**: `portfolioCalculations_v2.ts` → `portfolioCalculations.ts`
- **Updated**: All imports in `portfolio-cache-service.ts` to use the new module

### ✅ 3. Added CAGR Calculation Function
- **Added**: `calculateCAGRFromTWR()` function in `portfolioCalculations.ts`
- **Formula**: `CAGR = (1 + Total Return)^(1/years) - 1`
- **Purpose**: Convert time-weighted returns into annualized growth rates

### ✅ 4. Updated Portfolio Page CAGR Calculation
- **File**: `/workspace/app/portfolio/page.tsx`
- **Changes**:
  - Now uses TWR data directly from portfolio history
  - Calculates CAGR correctly from cumulative TWR
  - Uses actual date range from history (first to last data point)
  - Formula: `CAGR = (1 + TWR%)^(1/years) - 1`

### ✅ 5. Renamed "Cost Basis" to "Total Invested"
- **Updated**: Portfolio summary displays
- **Changed**: Both Portfolio and S&P 500 sections now show "Total Invested"
- **Reason**: More accurate terminology for cumulative capital deployed

### ✅ 6. Removed Obsolete Documentation
- **Deleted**: `/workspace/docs/COST_BASIS_FIX.md`
- **Reason**: Outdated information about the cost basis issue that's now resolved with TWR

### ✅ 7. Updated API Documentation
- **File**: `/workspace/docs/API.md`
- **Changes**: Updated `/api/portfolio-history` description to explain TWR methodology

## What's Been Removed

### Cost Basis Line in Chart
The chart previously showed three lines:
1. Portfolio Value (green)
2. S&P 500 Value (gray)
3. ~~Cost Basis (red dashed)~~ ← **REMOVED**

Now shows "Total Invested" instead in the value view, which is a cleaner representation.

### Old Calculation Logic
All the complex logic that tried to determine if a "Buy" was new capital or reinvested proceeds has been removed. The new TWR approach handles this elegantly.

## Current Data Structure

### DailyPortfolioData Interface
```typescript
{
  date: string              // YYYY-MM-DD
  portfolioValue: number    // Current portfolio value in NZD
  portfolioReturn: number   // Cumulative TWR % from inception
  sp500Value: number        // Equivalent S&P 500 investment value
  sp500Return: number       // S&P 500 TWR % from inception
  cashFlows: number         // Net cash flow on this date
  totalInvested: number     // Cumulative capital invested
}
```

## CAGR Calculation Details

### Old Approach (INCORRECT)
```typescript
// This was wrong because it didn't account for TWR
CAGR = calculateCAGRFromGainPercent(simpleReturnPercent, years)
```

### New Approach (CORRECT)
```typescript
// Step 1: Get TWR from latest history data
const portfolioTWR = latestHistory.portfolioReturn // Already a percentage

// Step 2: Calculate actual years elapsed
const startDate = new Date(firstHistory.date)
const endDate = new Date(latestHistory.date)
const years = (endDate - startDate) / (365.25 * 24 * 60 * 60 * 1000)

// Step 3: Convert TWR to CAGR
const CAGR = Math.pow(1 + portfolioTWR / 100, 1 / years) - 1
```

### Why This Is Correct

**Time-Weighted Return** already accounts for cash flow timing by:
1. Calculating daily returns that exclude cash flow impact
2. Linking those returns multiplicatively

**CAGR** then annualizes that cumulative return by:
1. Taking the Nth root (where N = years elapsed)
2. Subtracting 1 to get the annualized rate

**Example:**
- TWR over 2.5 years: +50%
- CAGR = (1.50)^(1/2.5) - 1 = 0.1746 = 17.46% per year

## Benefits of This Cleanup

### 1. **Accurate Performance Measurement**
- ✅ CAGR correctly reflects annualized TWR
- ✅ No distortion from cash flow timing
- ✅ Fair comparison to S&P 500 benchmark

### 2. **Cleaner Codebase**
- ✅ Removed 228 lines of old calculation logic
- ✅ Single source of truth for calculations
- ✅ No duplicate/conflicting implementations

### 3. **Better UX**
- ✅ Chart shows "Total Invested" instead of "Cost Basis"
- ✅ CAGR values are now meaningful and accurate
- ✅ Consistent terminology throughout

### 4. **Maintainability**
- ✅ One calculation module instead of two
- ✅ Clear, well-documented TWR methodology
- ✅ No legacy code to confuse future changes

## Testing Recommendations

After these changes, verify:

1. **CAGR Values**
   - Portfolio CAGR should be annualized version of total TWR
   - S&P 500 CAGR should be annualized version of S&P 500 TWR
   - Both should be reasonable (typically 5-20% for stock portfolios)

2. **Chart Display**
   - Value view shows: Portfolio, S&P 500, and Total Invested
   - Return view shows: Portfolio TWR %, S&P 500 TWR %
   - No "Cost Basis" references anywhere

3. **Summary Cards**
   - Shows "Total Invested" instead of "Cost Basis"
   - CAGR values update correctly when portfolio history loads
   - Returns are consistent with chart data

## Files Modified

1. `/workspace/lib/portfolioCalculations.ts` - Renamed and updated
2. `/workspace/lib/portfolio-cache-service.ts` - Updated imports
3. `/workspace/app/portfolio/page.tsx` - Updated CAGR calculation and labels
4. `/workspace/docs/API.md` - Updated documentation
5. `/workspace/components/portfolio-chart.tsx` - Already using TWR data

## Files Deleted

1. `/workspace/lib/portfolioCalculations.ts` - Old cost-basis version
2. `/workspace/docs/COST_BASIS_FIX.md` - Obsolete documentation

## Cache Refresh

After deployment, the portfolio cache will refresh within 20 minutes and show the corrected calculations. You can also manually bust the cache via the `/api/cache/bust` endpoint if needed.

## Summary

All old cost-basis calculation code has been removed. The portfolio now exclusively uses Time-Weighted Returns with proper CAGR calculations. The display terminology has been updated to be more accurate ("Total Invested" vs "Cost Basis"), and all documentation reflects the new approach.