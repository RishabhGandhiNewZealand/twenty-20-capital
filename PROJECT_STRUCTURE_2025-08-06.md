# Project Structure Documentation

## Current Structure

```
/workspace
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   │   ├── exchange-rate/
│   │   ├── news/
│   │   ├── portfolio/
│   │   ├── portfolio-composition/
│   │   ├── portfolio-current/
│   │   ├── portfolio-history/
│   │   └── stock-price/
│   ├── about/             # About page
│   ├── analyses/          # Stock analyses pages
│   ├── news/              # News page
│   ├── reports/           # Quarterly reports
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (main dashboard)
│
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── app-sidebar.tsx
│   ├── nav-user.tsx
│   ├── navigation.tsx
│   ├── portfolio-chart.tsx
│   ├── portfolio-horizontal-bar-chart.tsx
│   └── theme-provider.tsx
│
├── hooks/                # Custom React hooks
│   └── use-toast.ts
│
├── lib/                  # Utility functions and configurations
│   ├── blob-utils.ts
│   ├── company-colors.ts
│   ├── company-utils.ts
│   ├── constants.ts
│   ├── db-migrations.ts
│   ├── db.ts
│   ├── financial-calculations.ts
│   ├── format-utils.ts
│   ├── logger.ts
│   ├── news-cache.ts
│   ├── performance-utils.ts
│   ├── portfolio.ts
│   ├── portfolioServerData.ts
│   └── utils.ts
│
├── public/              # Static assets
│   └── data/           # Generated data files
│
├── scripts/            # Build and utility scripts
│   ├── cache-portfolio-compositions.ts
│   └── generate-favicon.js
│
├── styles/            # Additional styles
│
└── types/             # TypeScript type definitions
    └── portfolio.ts
```

## Structural Improvements

### 1. **Modularize API Routes**

Create a more organized API structure with shared utilities:

```
app/api/
├── _lib/                    # Shared API utilities
│   ├── auth.ts             # Authentication helpers
│   ├── errors.ts           # Error handling
│   ├── validation.ts       # Request validation
│   └── response.ts         # Response helpers
├── portfolio/
│   ├── current/route.ts
│   ├── history/route.ts
│   └── composition/[date]/route.ts
```

### 2. **Component Organization**

Organize components by feature/domain:

```
components/
├── charts/                  # Chart-related components
│   ├── PortfolioChart/
│   │   ├── index.tsx
│   │   ├── PortfolioChart.tsx
│   │   └── PortfolioChart.types.ts
│   └── PortfolioBarChart/
├── dashboard/              # Dashboard-specific components
│   ├── HoldingsTable/
│   └── PortfolioStats/
├── layout/                 # Layout components
│   ├── AppSidebar/
│   ├── Navigation/
│   └── NavUser/
└── ui/                     # Generic UI components
```

### 3. **Feature-Based Organization**

Consider organizing by feature for better scalability:

```
features/
├── portfolio/
│   ├── api/               # Portfolio API routes
│   ├── components/        # Portfolio components
│   ├── hooks/            # Portfolio hooks
│   ├── types/            # Portfolio types
│   └── utils/            # Portfolio utilities
├── news/
│   ├── api/
│   ├── components/
│   └── utils/
└── analyses/
    ├── components/
    └── utils/
```

### 4. **Environment Configuration**

Create a centralized configuration:

```
config/
├── constants.ts          # App-wide constants
├── environment.ts        # Environment variables
└── features.ts          # Feature flags
```

### 5. **Testing Structure**

Add a testing structure:

```
__tests__/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── e2e/                # End-to-end tests
```

## Recommended Improvements

### 1. **Create Barrel Exports**

Add index.ts files for cleaner imports:

```typescript
// components/charts/index.ts
export { PortfolioChart } from './PortfolioChart'
export { PortfolioBarChart } from './PortfolioBarChart'
```

### 2. **Separate Business Logic**

Move business logic out of components:

```
services/
├── portfolio.service.ts    # Portfolio calculations
├── market.service.ts      # Market data fetching
└── news.service.ts        # News aggregation
```

### 3. **Add Error Boundaries**

Create error boundary components:

```
components/
└── error-boundaries/
    ├── AppErrorBoundary.tsx
    └── ChartErrorBoundary.tsx
```

### 4. **Implement Data Layer**

Add a data access layer:

```
data/
├── repositories/          # Data repositories
│   ├── portfolio.repository.ts
│   └── market.repository.ts
└── models/               # Data models
    ├── portfolio.model.ts
    └── holding.model.ts
```

### 5. **Add Middleware**

Create API middleware:

```
middleware/
├── auth.ts              # Authentication
├── cors.ts              # CORS handling
├── rateLimit.ts         # Rate limiting
└── validation.ts        # Request validation
```

## Migration Strategy

1. **Phase 1**: Create new directory structure
2. **Phase 2**: Move files incrementally with git mv
3. **Phase 3**: Update imports using search/replace
4. **Phase 4**: Add barrel exports
5. **Phase 5**: Refactor to feature-based structure

## Benefits

1. **Better Organization**: Easier to find and maintain code
2. **Scalability**: Structure scales with app growth
3. **Team Collaboration**: Clear boundaries between features
4. **Testing**: Organized test structure
5. **Reusability**: Shared utilities and components