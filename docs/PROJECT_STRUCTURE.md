# Project Structure Documentation

## Overview

This document provides a comprehensive map of the Personal Portfolio Tracker application's codebase, detailing the organization, dependencies, and responsibilities of each component.

## Project Statistics

- **Total TypeScript/React Files**: 93
- **Lines of Code**: ~15,000+
- **Main Technologies**: Next.js 15, TypeScript, PostgreSQL, Tailwind CSS
- **Architecture Pattern**: App Router with Server Components

## Directory Structure

```
portfolio-tracker/
├── app/                      # Next.js App Router (34 files)
├── components/               # React Components (26 files)
├── lib/                      # Business Logic & Utilities (20 files)
├── contexts/                 # React Contexts (1 file)
├── hooks/                    # Custom React Hooks (2 files)
├── types/                    # TypeScript Definitions (2 files)
├── scripts/                  # Build & Data Scripts (4 files)
├── styles/                   # Global Styles
├── public/                   # Static Assets
├── docs/                     # Documentation
└── __tests__/               # Test Files
```

## Core Application Structure

### 1. App Directory (`/app`) - Next.js App Router

The application uses Next.js 15's App Router for routing and server-side rendering.

#### Main Pages
- `page.tsx` - Dashboard home page with portfolio overview
- `portfolio/page.tsx` - Detailed portfolio view with performance charts
- `trades/page.tsx` - Trade management interface
- `news/page.tsx` - AI-powered news analysis
- `about/page.tsx` - About page with project information

#### API Routes (`/app/api`)
Organized into functional domains:

**Portfolio Management**
- `/portfolio` - Complete portfolio data
- `/portfolio-current` - Real-time portfolio summary
- `/portfolio-history` - Historical performance data
- `/portfolio-compositions` - Historical compositions

**Trade Management**
- `/trades` - CRUD operations for trades
- `/trades/[id]` - Individual trade operations
- `/trades/batch` - Batch trade updates

**Market Data**
- `/stock-price/[symbol]` - Real-time stock prices
- `/exchange-rate` - Currency conversion rates

**News & Analysis**
- `/news` - AI-powered news analysis
- `/news/company` - Company-specific news
- `/news/cache-*` - News cache management

**Cache Management**
- `/cache/bust` - Cache invalidation
- `/cache/warmup` - Cache pre-warming
- `/cache/stats` - Cache statistics

**Authentication**
- `/auth/verify-password` - Password verification for anonymization

#### Reports (`/app/reports`)
- `2024-review/page.tsx` - Annual review for 2024
- `q1-2025/page.tsx` - Q1 2025 quarterly report
- `q2-2025/page.tsx` - Q2 2025 quarterly report

#### Company Analyses (`/app/analyses`)
- `asml/page.tsx` - ASML company analysis
- `uber/page.tsx` - Uber company analysis

### 2. Components Directory (`/components`)

#### Core Application Components
- `portfolio-chart.tsx` - Main performance visualization
- `portfolio-horizontal-bar-chart.tsx` - Allocation visualization
- `trade-form-modal.tsx` - Trade entry/edit form
- `password-modal.tsx` - Authentication modal
- `confirmation-dialog.tsx` - Confirmation dialogs
- `sidebar-navigation.tsx` - Main navigation
- `nav-user.tsx` - User navigation component
- `theme-provider.tsx` - Theme context provider
- `theme-toggle.tsx` - Dark/light mode toggle

#### UI Components (`/components/ui`)
Reusable UI primitives from shadcn/ui:
- `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`
- `alert-dialog.tsx`, `avatar.tsx`, `dropdown-menu.tsx`
- `label.tsx`, `select.tsx`, `sheet.tsx`, `slider.tsx`
- `switch.tsx`, `toast.tsx`, `toaster.tsx`

### 3. Library Directory (`/lib`)

Core business logic and utilities.

#### Data Layer
- `db.ts` - PostgreSQL database connection
- `trade-data-cache.ts` - Trade data access layer
- `portfolio.ts` - Portfolio calculation logic
- `portfolioCalculations.ts` - Performance calculations
- `portfolioServerData.ts` - Server-side data fetching
- `portfolio-cache-service.ts` - Portfolio caching layer

#### Caching System
- `cache-manager.ts` - Central cache management
- `cache-config.ts` - Cache configuration
- `news-cache.ts` - News-specific caching
- `news-analysis-cache.ts` - AI analysis caching

#### Utilities
- `financial-calculations.ts` - CAGR, returns calculations
- `format-utils.ts` - Number, currency, date formatting
- `anonymization-utils.ts` - Data masking utilities
- `company-utils.ts` - Company-related helpers
- `company-colors.ts` - Company color mapping
- `performance-utils.ts` - Performance optimization
- `logger.ts` - Application logging
- `utils.ts` - General utilities
- `constants.ts` - Application constants

#### Database
- `db-migrations.ts` - Database migration utilities

### 4. Other Directories

#### Contexts (`/contexts`)
- `AnonymizationContext.tsx` - Global anonymization state

#### Hooks (`/hooks`)
- `use-mobile.tsx` - Responsive design hook
- `use-toast.ts` - Toast notification hook

#### Types (`/types`)
- `portfolio.ts` - Portfolio-related types
- `news.ts` - News analysis types

#### Scripts (`/scripts`)
- `cache-portfolio-compositions.ts` - Build-time caching
- `migrate-to-postgres.ts` - Database migration
- `test-news-analysis.ts` - News API testing
- `verify-build.ts` - Build verification

## Data Flow Architecture

```
User Request
    ↓
Next.js App Router
    ↓
API Route Handler
    ↓
Business Logic (lib/)
    ↓
Database/External APIs
    ↓
Cache Layer
    ↓
Response
```

## Key Dependencies & Integrations

### External Services
1. **Neon Database** - PostgreSQL for trade data storage
2. **Yahoo Finance API** - Real-time market data
3. **Google Gemini API** - AI-powered news analysis
4. **Vercel** - Hosting and edge functions

### Internal Dependencies
- Components depend on UI primitives
- API routes depend on lib functions
- Lib functions are mostly independent
- Cache layer wraps data access

## Performance Optimizations

1. **Server Components by Default** - Reduced client bundle
2. **Multi-tier Caching** - Memory and database caching
3. **Parallel Data Fetching** - Concurrent API calls
4. **Code Splitting** - Route-based splitting
5. **Image Optimization** - Next.js Image component

## Development Patterns

### State Management
- Server state via Next.js data fetching
- Client state via React hooks
- Global state via Context API
- URL state for shareable views

### Error Handling
- Try-catch blocks in API routes
- Error boundaries in components
- Logging via centralized logger
- User-friendly error messages

### Type Safety
- Strict TypeScript configuration
- Typed API responses
- Interface definitions for all data
- Type guards for runtime validation

## Testing Strategy

- Unit tests for utility functions
- Integration tests for API routes
- Component testing with React Testing Library
- End-to-end testing considerations

## Build & Deployment

### Build Process
1. TypeScript compilation
2. Next.js optimization
3. Asset optimization
4. Cache pre-warming

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `GEMINI_API_KEY` - AI news analysis
- `ADMIN_PASSWORD` - Anonymization control

## Code Quality Metrics

### Clean Code Practices
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Clear naming conventions
- Comprehensive JSDoc comments

### Recently Removed Dead Code
- Unused CSV parsing functions
- Vercel Blob storage utilities
- Redundant portfolio calculations
- Unused cache configuration

## Future Considerations

### Scalability
- Database indexing optimization
- CDN integration for assets
- WebSocket for real-time updates
- Microservices architecture

### Features
- Multi-user support
- Advanced analytics
- Mobile application
- Export functionality

## Maintenance Guidelines

### Adding New Features
1. Create feature branch
2. Add types to `/types`
3. Implement logic in `/lib`
4. Create API route if needed
5. Build UI components
6. Update documentation

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Performance considered
- [ ] Documentation updated
- [ ] No dead code introduced

## Conclusion

The codebase follows modern React and Next.js best practices with a clear separation of concerns. The architecture supports both current requirements and future scaling needs while maintaining code quality and performance.