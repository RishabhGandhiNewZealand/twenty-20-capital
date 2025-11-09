# Watchlist Feature Implementation Plan

## Overview
Implement a comprehensive watchlist feature with scenario modeling capabilities, similar to the Excel template provided. The feature will have two views: "My Watchlist" (user-specific) and "Rish's Watchlist" (admin-only).

## Analysis Summary

### Existing Patterns Observed

1. **Architecture**
   - Next.js 15 with App Router
   - TypeScript for type safety
   - PostgreSQL via Neon serverless
   - StackFrame Stack for authentication

2. **API Patterns**
   - Route handlers in `/app/api/[feature]/route.ts`
   - User authentication via headers: `x-user-id`, `x-user-email`, `x-is-admin`
   - RLS (Row Level Security) with `getUserDb(userId)`
   - Cache control headers on all responses

3. **UI Patterns**
   - shadcn/ui components (Radix UI + Tailwind)
   - Client components with "use client" directive
   - Loading states with Loader2 spinner
   - Error handling with AlertCircle
   - Desktop: Tables, Mobile: Cards
   - Modal dialogs for forms (Dialog component)

4. **Data Flow**
   - useEffect for data fetching on mount
   - useState for local state management
   - Parallel API calls with Promise.all
   - Optimistic UI updates with staged changes
   - Batch operations for saves

5. **Styling**
   - Tailwind CSS utility classes
   - Color scheme: blue for primary, green/red for gains/losses
   - Responsive breakpoints: sm, md, lg
   - Card-based layouts with CardHeader/CardContent

## Database Schema

### Tables Created
```sql
-- Watchlist table
application.watchlist
  - id (SERIAL PRIMARY KEY)
  - user_id (TEXT NOT NULL)
  - ticker (TEXT NOT NULL)
  - company_name (TEXT NOT NULL)
  - ttm_revenue (NUMERIC)
  - market_cap (NUMERIC)
  - current_stock_price (NUMERIC)
  - notes (TEXT)
  - created_at, updated_at (TIMESTAMP)
  - UNIQUE(user_id, ticker)

-- Scenarios table
application.watchlist_scenarios
  - id (SERIAL PRIMARY KEY)
  - watchlist_id (INTEGER REFERENCES watchlist)
  - scenario_name (TEXT)
  - revenue_growth_2025_2030 (NUMERIC)
  - ebitda_margin (NUMERIC)
  - capex_percent (NUMERIC)
  - tax_rate (NUMERIC)
  - [2025 and 2030 projections fields]
  - estimated_value (NUMERIC)
  - cagr (NUMERIC)
  - probability (NUMERIC)
  - created_at, updated_at (TIMESTAMP)
  - UNIQUE(watchlist_id, scenario_name)
```

## API Endpoints

### Already Created
1. ✅ `/api/yahoo-finance/search` - Search for companies by ticker
2. ✅ `/api/yahoo-finance/quote` - Get detailed financial data
3. ✅ `/api/watchlist` - GET (fetch watchlist) & POST (add company)
4. ✅ `/api/watchlist/[id]` - DELETE (remove company)
5. ✅ `/api/watchlist/scenarios` - POST (save scenarios)

### Features
- User-scoped queries (userId in WHERE clause)
- Support for "Rish's watchlist" via query param `?rish=true`
- Nested data loading (watchlist + scenarios in single response)
- Upsert pattern for watchlist items (ON CONFLICT)

## Component Structure

### 1. Pages (Client Components)
```
/app/watchlist/page.tsx           -> My Watchlist
/app/rishs-watchlist/page.tsx     -> Rish's Watchlist
```

### 2. Reusable Components
```
/components/company-search.tsx               -> Yahoo Finance search autocomplete
/components/watchlist-table.tsx              -> Display watchlist with actions
/components/scenario-modeling-form.tsx       -> Scenario input form with calculations
/components/watchlist-company-card.tsx       -> Mobile-friendly company card
/components/expected-return-calculator.tsx   -> Calculates probability-weighted returns
```

### 3. Type Definitions
```typescript
// /types/watchlist.ts
interface WatchlistItem {
  id: number
  userId: string
  ticker: string
  companyName: string
  ttmRevenue: number | null
  marketCap: number | null
  currentStockPrice: number | null
  notes: string | null
  scenarios: Scenario[]
  createdAt: string
  updatedAt: string
}

interface Scenario {
  id: number
  scenarioName: string
  revenueGrowth20252030: number
  ebitdaMargin: number
  capexPercent: number
  taxRate: number
  // ... projections
  estimatedValue: number | null
  cagr: number | null
  probability: number | null
}

interface CompanySearchResult {
  symbol: string
  shortname: string
  longname: string
  exchange: string
  quoteType: string
}

interface CompanyFinancials {
  symbol: string
  shortName: string
  longName: string
  currentPrice: number | null
  marketCap: number | null
  ttmRevenue: number | null
  // ... additional metrics
}
```

## Feature Requirements

### Excel Template Analysis
From the provided screenshot:
1. **Company Header** - Shows company name, ticker (ZETA)
2. **Base Assumptions Table**
   - Revenue Growth (2025-2030 CAGR)
   - EBITDA Margin
   - Capex % of revenue
   - Tax Rate
   - Current Market Cap
   - Final FCF yield

3. **Scenario Projections (2025 & 2030)**
   - Revenue
   - EBITDA
   - Capex
   - Cash Flow
   - Estimated Value
   - CAGR

4. **Multiple Scenarios** (Bear, Base, Bull, Worst)
5. **Expected Return Calculation**
   - Probability for each scenario
   - Weighted expected return
   - Risk-free return comparison

### Implementation Details

#### Company Search Component
- Debounced search input
- Autocomplete dropdown with Yahoo Finance results
- Shows: Symbol, Company Name, Exchange
- On select: Fetch full financial data
- Pre-fill TTM revenue and market cap

#### Watchlist Table
- Desktop: Full table with all companies
- Mobile: Scrollable cards
- Columns:
  - Company (logo, ticker, name)
  - TTM Revenue
  - Current Market Cap
  - Current Stock Price
  - # of Scenarios
  - Expected Return (calculated)
  - Actions (Edit Scenarios, Delete)
- Sorting and filtering
- Empty state with "Add Company" CTA

#### Scenario Modeling Form
- Modal dialog (like TradeFormModal pattern)
- Input fields for base assumptions:
  - Revenue Growth 2025-2030 (%)
  - EBITDA Margin (%)
  - Capex % of Revenue
  - Tax Rate (%)
  - Current Market Cap (auto-filled)
  - Final FCF Yield (%)
  - Probability (%)

- Automatic calculations:
  - 2025 projections (Revenue, EBITDA, Capex, Cash Flow)
  - 2030 projections (with CAGR)
  - Estimated Value
  - CAGR from current price
  
- Multiple scenario tabs (Bear, Base, Bull, etc.)
- Save all scenarios in one batch operation

#### Expected Return Calculation
```typescript
expectedReturn = Σ(probability_i × return_i)
where return_i = (estimatedValue - currentMarketCap) / currentMarketCap
```

## Page Implementation

### My Watchlist Page (`/app/watchlist/page.tsx`)
```typescript
Features:
- User authentication check (redirect if not logged in)
- Fetch user's watchlist on mount
- Company search bar
- Add company flow:
  1. Search and select company
  2. Confirm TTM revenue / market cap
  3. Add to watchlist
  4. Open scenario modeling
- Watchlist table/cards
- Edit scenarios modal
- Delete company confirmation
- Empty state with helpful message
```

### Rish's Watchlist Page (`/app/rishs-watchlist/page.tsx`)
```typescript
Features:
- Similar to My Watchlist but read-only for non-admin
- Admin can edit (check isAdmin from context)
- Fetch with `?rish=true` parameter
- Shows "Rish's Watchlist" title
- Admin-only actions
```

## Navigation Updates

Update `/components/sidebar-navigation.tsx`:
```typescript
const myPortfolioItems = user ? [
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/trades", label: "Trades", icon: Database },
  { href: "/watchlist", label: "Watchlist", icon: Eye }, // NEW
] : []

const rishInsightsItems = [
  { href: "/rishs-portfolio", label: "Rish's Portfolio", icon: TrendingUp },
  { href: "/rishs-watchlist", label: "Rish's Watchlist", icon: Eye }, // NEW
  { href: "/analyses", label: "Analyses", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/investment-thesis", label: "Investment Thesis", icon: BookOpen },
]
```

## Financial Calculation Logic

### Scenario Projections
```typescript
// 2025 Projections
const revenue2025 = currentRevenue * (1 + revenueGrowth/100)
const ebitda2025 = revenue2025 * (ebitdaMargin/100)
const capex2025 = revenue2025 * (capexPercent/100)
const cashFlow2025 = (ebitda2025 - capex2025) * (1 - taxRate/100)

// 2030 Projections (5 years from 2025)
const revenue2030 = revenue2025 * Math.pow(1 + revenueGrowth/100, 5)
const ebitda2030 = revenue2030 * (ebitdaMargin/100)
const capex2030 = revenue2030 * (capexPercent/100)
const cashFlow2030 = (ebitda2030 - capex2030) * (1 - taxRate/100)

// Estimated Value (using FCF yield)
const estimatedValue = cashFlow2030 / (fcfYield/100)

// CAGR from current price
const years = 5
const cagr = Math.pow(estimatedValue / currentMarketCap, 1/years) - 1
```

### Expected Return
```typescript
const expectedReturn = scenarios.reduce((sum, scenario) => {
  const individualReturn = ((scenario.estimatedValue - currentMarketCap) / currentMarketCap) * 100
  return sum + (scenario.probability/100) * individualReturn
}, 0)
```

## Implementation Steps

### Phase 1: Database & API (✅ Mostly Done)
1. ✅ Create database migration script
2. ✅ Create Yahoo Finance search endpoint
3. ✅ Create Yahoo Finance quote endpoint
4. ✅ Create watchlist CRUD endpoints
5. ✅ Create scenarios endpoint

### Phase 2: Type Definitions & Utilities
6. Create `/types/watchlist.ts`
7. Create financial calculation helpers in `/lib/watchlist-calculations.ts`
8. Add watchlist icon import (Eye from lucide-react)

### Phase 3: Reusable Components
9. Create CompanySearch component
10. Create WatchlistTable component
11. Create ScenarioModelingForm component
12. Create ExpectedReturnDisplay component

### Phase 4: Pages
13. Create `/app/watchlist/page.tsx` (My Watchlist)
14. Create `/app/rishs-watchlist/page.tsx` (Rish's Watchlist)

### Phase 5: Integration
15. Update sidebar navigation
16. Test end-to-end flow
17. Add loading states and error handling
18. Ensure mobile responsiveness
19. Run database migration

### Phase 6: Polish
20. Add empty states
21. Add confirmation dialogs
22. Add tooltips for complex fields
23. Format numbers consistently
24. Add data validation

## Testing Checklist

- [ ] Search for companies via Yahoo Finance
- [ ] Add company to watchlist
- [ ] Create multiple scenarios
- [ ] Edit scenarios
- [ ] Delete scenarios
- [ ] Delete company from watchlist
- [ ] Expected return calculation accuracy
- [ ] Rish's watchlist visibility
- [ ] Admin can edit Rish's watchlist
- [ ] Non-admin cannot edit Rish's watchlist
- [ ] Mobile responsiveness
- [ ] Error handling (API failures)
- [ ] Loading states
- [ ] Empty states
- [ ] Data persistence across page reloads

## Technical Considerations

1. **Yahoo Finance API Rate Limits**
   - Cache search results client-side
   - Debounce search queries (500ms)
   - Consider rate limit error handling

2. **Data Validation**
   - Ensure percentages are 0-100
   - Ensure positive values for revenue, market cap
   - Validate scenario names are unique per watchlist item

3. **Performance**
   - Fetch watchlist with scenarios in single query (JOIN)
   - Use React.memo for scenario cards
   - Pagination if watchlist grows large

4. **Security**
   - Enforce user_id in all queries
   - Admin check for Rish's watchlist editing
   - SQL injection prevention (parameterized queries)

5. **UX Enhancements**
   - Auto-save scenarios (or show unsaved changes warning)
   - Keyboard navigation in search
   - Drag-and-drop to reorder scenarios
   - Export watchlist to CSV/Excel

## Future Enhancements (Out of Scope)

- Historical tracking of scenarios
- Email alerts when price targets are hit
- Integration with portfolio holdings
- Comparative analysis across watchlist
- News feed integration per company
- Custom scenario templates
- Collaboration features (share watchlists)
