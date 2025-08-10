# Anonymization Log

## Anonymization Constant
- **CONSTANT = π * e ≈ 8.539734222673566**

## Numbers to be Anonymized

### 1. Raw Trade Data (from database in `/lib/trade-data-cache.ts`)
- ✅ **qty** - Number of shares in each trade
- ✅ **price** - Price per share
- ✅ **brokerage** - Brokerage fees
- ✅ **value** - Total trade value

### 2. Portfolio Values & Cost Basis
- ✅ **portfolioValue** - Current portfolio value
- ✅ **costBasis** - Total invested capital
- ✅ **totalCostBasisNZD** - Cost basis in NZD
- ✅ **currentValueNZD** - Current value in NZD
- ✅ **sp500Value** - S&P 500 equivalent value

### 3. Hard-coded Values in Report Pages

#### `/app/reports/q1-2025/page.tsx`
- ✅ Portfolio Value: $34,788 NZD
- ✅ Portfolio Additions: $6,500 NZD
- ✅ shares: 40, 15, 13, 3, 2, 4, 4, 5, 50
- ✅ usdValue: 2916, 2310, 2470, 1728, 1864, 2192, 2648, 2540, 2279
- ✅ nzdValue: $4,860, $3,850, $4,117, $2,880, $3,107, $3,653, $4,413, $4,233, $3,675

#### `/app/reports/q2-2025/page.tsx`
- Similar hard-coded values for Q2 report

#### `/app/analyses/uber/page.tsx`
- ✅ Intrinsic Value: $110 USD
- ✅ Example transaction values: $30, $40, $20, $10

#### `/app/analyses/asml/page.tsx`
- Similar intrinsic value and example values

### 4. Values NOT to be Anonymized (Calculated/Derived)

- ❌ **CAGR** - Calculated annual growth rate
- ❌ **Percentage returns** - Relative performance metrics (-5.4%, +6.5%, etc.)
- ❌ **Allocation percentages** - Portfolio weightings
- ❌ **Exchange rates** - Market data
- ❌ **S&P 500 returns** - Benchmark comparison

## Uncertain Cases (Need User Confirmation)

### Question 1: Current Stock Prices
- **Location**: Real-time prices fetched from Yahoo Finance API
- **Question**: Should current market prices be anonymized? These are public market data.
- **Recommendation**: DO NOT anonymize (public data)

### Question 2: Historical Stock Prices
- **Location**: Historical prices from Yahoo Finance for portfolio calculations
- **Question**: Should historical market prices be anonymized?
- **Recommendation**: DO NOT anonymize (public data)

### Question 3: Dates
- **Location**: Trade dates, purchase dates
- **Question**: Should dates be anonymized or shifted?
- **Recommendation**: Keep dates as-is (not financial amounts)

### Question 4: Company Names/Symbols
- **Location**: Throughout the codebase
- **Question**: Should company names and ticker symbols be anonymized?
- **Recommendation**: Keep as-is (not financial amounts)

### Question 5: Gains/Losses (Absolute Values)
- **Location**: totalGainNZD, gainNZD, profitLossNZD
- **Question**: Should absolute gain/loss amounts be anonymized?
- **Recommendation**: YES, anonymize (derived from anonymized values)

## Implementation Strategy

1. Start with database-level anonymization in trade-data-cache.ts
2. Apply to API routes that calculate portfolio values
3. Update hard-coded values in report pages
4. Update analysis pages with anonymized values
5. Ensure calculated percentages remain unchanged

## ✅ COMPLETION STATUS

### Implemented Changes:

1. **Created anonymization constant** (`/lib/anonymization-constant.ts`)
   - CONSTANT = π * e ≈ 8.539734222673566

2. **Updated trade data source** (`/lib/trade-data-cache.ts`)
   - Applied multiplication to qty, price, brokerage, and value fields
   - Exchange rates kept unchanged (public market data)

3. **Updated report pages with anonymized values:**
   - ✅ `/app/reports/q1-2025/page.tsx` - All portfolio values, shares, and amounts
   - ✅ `/app/reports/q2-2025/page.tsx` - All portfolio values, shares, and amounts
   - ✅ `/app/reports/2024-review/page.tsx` - Intrinsic values, cost basis, prices, investment amounts

4. **Updated analysis pages:**
   - ✅ `/app/analyses/uber/page.tsx` - Intrinsic value and example transaction amounts
   - ✅ `/app/analyses/asml/page.tsx` - Intrinsic value, machine prices, and price targets

### Important Notes:

- **Percentages remain unchanged** - All percentage calculations (CAGR, returns, allocations) are preserved
- **Market data preserved** - Stock prices from Yahoo Finance API are not anonymized
- **Exchange rates unchanged** - These are public market data
- **Build tested successfully** - All changes compile without errors

### What Gets Anonymized:

When the website loads, all displayed financial numbers will be multiplied by ~8.54:
- Your actual portfolio value
- Number of shares owned
- Trade prices and values
- Investment amounts
- Cost basis
- But NOT percentages, ratios, or market data