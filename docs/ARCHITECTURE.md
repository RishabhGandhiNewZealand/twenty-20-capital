# Architecture Documentation

This document outlines the architecture, design patterns, and technical decisions made in the Personal Portfolio Tracker application.

## Overview

The Personal Portfolio Tracker is built using a modern, scalable architecture leveraging:

- **Next.js 15** with App Router for server-side rendering and routing
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling
- **Vercel** for deployment and edge functions
- **Vercel Blob** for data storage

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Application                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    App Router                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   Pages     │  │  API Routes │  │ Components │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Business Logic                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   Lib       │  │   Hooks     │  │   Types    │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Vercel Blob │  │Yahoo Finance│  │  Vercel Edge   │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── app/                        # Next.js App Router
│   ├── api/                   # API endpoints
│   │   ├── portfolio/         # Portfolio data endpoints
│   │   ├── stock-price/       # Real-time stock prices
│   │   └── exchange-rate/     # Currency conversion
│   ├── analyses/              # Company analysis pages
│   ├── reports/               # Portfolio reports
│   ├── about/                 # Static pages
│   ├── layout.tsx             # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/                # React components
│   ├── ui/                   # shadcn/ui components
│   ├── portfolio-chart.tsx   # Chart components
│   └── app-sidebar.tsx       # Navigation components
├── lib/                      # Utility functions
│   ├── portfolio.ts          # Portfolio calculations
│   ├── blob-utils.ts         # Storage utilities
│   ├── constants.ts          # App constants
│   └── utils.ts              # Helper functions
├── hooks/                    # Custom React hooks
│   ├── use-mobile.tsx        # Responsive hooks
│   └── use-toast.ts          # UI hooks
├── types/                    # TypeScript definitions
│   ├── portfolio.ts          # Portfolio types
│   └── stock.ts              # Market data types
├── scripts/                  # Build scripts
│   └── cache-portfolio-compositions.ts
├── public/                   # Static assets
└── styles/                   # Additional styles
```

## Core Design Patterns

### 1. Server Components by Default

Next.js 15's App Router uses React Server Components by default, providing:

- Better performance with smaller client bundles
- Direct database/API access
- Improved SEO
- Reduced client-side JavaScript

```typescript
// Server Component (default)
async function PortfolioData() {
  const data = await fetchPortfolioData() // Direct API call
  return <PortfolioChart data={data} />
}

// Client Component (when needed)
"use client"
function InteractiveChart() {
  const [selected, setSelected] = useState()
  // Client-side interactivity
}
```

### 2. API Route Handlers

API routes handle data fetching and external service integration:

```typescript
// app/api/portfolio/route.ts
export async function GET() {
  const data = await generatePortfolioData()
  return NextResponse.json(data)
}
```

### 3. Type Safety

TypeScript is used throughout for type safety:

```typescript
// types/portfolio.ts
export interface PortfolioHolding {
  symbol: string
  shares: number
  costBasis: number
  currentValue: number
}

// Strict typing in components
function Holdings({ data }: { data: PortfolioHolding[] }) {
  // Type-safe operations
}
```

### 4. Composition Pattern

Components are built using composition for flexibility:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Portfolio Value</CardTitle>
  </CardHeader>
  <CardContent>
    <PortfolioChart />
  </CardContent>
</Card>
```

## Data Flow

### 1. Portfolio Data Flow

```
User Request → API Route → Vercel Blob → Parse CSV → Calculate Holdings → Return JSON
```

### 2. Real-time Price Updates

```
Client Request → API Route → Yahoo Finance API → Cache → Return Price Data
```

### 3. Build-time Optimization

```
Build Process → Script Execution → Pre-calculate Compositions → Cache Results
```

## State Management

The application uses a simple state management approach:

1. **Server State**: Managed by Next.js data fetching
2. **Client State**: React useState for local UI state
3. **URL State**: Query parameters for shareable state

```typescript
// Server state
const portfolioData = await fetch('/api/portfolio')

// Client state
const [filter, setFilter] = useState('all')

// URL state
const searchParams = useSearchParams()
const view = searchParams.get('view')
```

## Performance Optimizations

### 1. Static Generation

Pages without dynamic data are statically generated:

```typescript
// Statically generated at build time
export default function AboutPage() {
  return <StaticContent />
}
```

### 2. Dynamic Rendering

Portfolio data uses dynamic rendering with caching:

```typescript
// Dynamically rendered with cache
export const revalidate = 300 // 5 minutes

async function PortfolioPage() {
  const data = await fetchPortfolio()
  return <Portfolio data={data} />
}
```

### 3. Image Optimization

Next.js Image component for optimized loading:

```typescript
<Image
  src={companyLogo}
  alt={companyName}
  width={40}
  height={40}
  loading="lazy"
/>
```

### 4. Code Splitting

Automatic code splitting with dynamic imports:

```typescript
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

## Security Considerations

### 1. Environment Variables

Sensitive data stored in environment variables:

```typescript
// Server-only access
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

// Never exposed to client
```

### 2. API Security

- Server-side only API calls
- Input validation
- Error handling
- Rate limiting through Vercel

### 3. Content Security Policy

Headers configured for security:

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

## Deployment Architecture

### Vercel Platform

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  Vercel Build   │────▶│   Edge Network  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Blob Storage   │     │  Edge Functions │
                        └─────────────────┘     └─────────────────┘
```

### Build Pipeline

1. **Source Control**: GitHub repository
2. **CI/CD**: Vercel automatic deployments
3. **Build Process**: 
   - Install dependencies
   - Run build scripts
   - Generate static assets
   - Deploy to edge network
4. **Edge Distribution**: Global CDN

## Caching Strategy

### 1. Build-time Caching

Portfolio compositions pre-calculated during build:

```typescript
// scripts/cache-portfolio-compositions.ts
const compositions = await calculateCompositions()
await fs.writeFile('cache/compositions.json', compositions)
```

### 2. Runtime Caching

API responses cached in memory:

```typescript
const cache = new Map()

export async function getCachedPrice(symbol: string) {
  if (cache.has(symbol)) {
    return cache.get(symbol)
  }
  const price = await fetchPrice(symbol)
  cache.set(symbol, price)
  return price
}
```

### 3. Browser Caching

Static assets cached by service worker:

```typescript
// Public assets cached for offline use
cache.addAll([
  '/favicon.ico',
  '/manifest.json'
])
```

## Error Handling

### 1. Error Boundaries

React error boundaries for graceful failures:

```typescript
export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 2. API Error Handling

Consistent error responses:

```typescript
try {
  const data = await fetchData()
  return NextResponse.json(data)
} catch (error) {
  return NextResponse.json(
    { error: 'Failed to fetch data' },
    { status: 500 }
  )
}
```

## Testing Strategy

### 1. Unit Tests

- Utility functions
- Calculations
- Data transformations

### 2. Integration Tests

- API endpoints
- Component interactions
- Data flow

### 3. E2E Tests

- User workflows
- Critical paths
- Cross-browser testing

## Monitoring and Analytics

### 1. Vercel Analytics

- Page views
- Web vitals
- User interactions

### 2. Error Tracking

- Runtime errors
- API failures
- Performance issues

### 3. Custom Logging

```typescript
import { logger } from '@/lib/logger'

logger.info('Portfolio calculated', { userId, value })
logger.error('API failed', { error, endpoint })
```

## Future Architecture Considerations

### 1. Scalability

- Database integration for user data
- Redis for distributed caching
- Queue system for background jobs

### 2. Features

- WebSocket for real-time updates
- GraphQL API
- Mobile app with React Native

### 3. Performance

- Edge computing for calculations
- Service workers for offline
- WebAssembly for complex calculations

## Development Workflow

### 1. Local Development

```bash
npm run dev
# Starts development server with hot reload
```

### 2. Type Checking

```bash
npx tsc --noEmit
# Validates TypeScript types
```

### 3. Linting

```bash
npm run lint
# Checks code quality
```

### 4. Building

```bash
npm run build
# Creates production build
```

## Conclusion

This architecture provides a solid foundation for a portfolio tracking application with:

- **Performance**: Server-side rendering and edge deployment
- **Scalability**: Serverless architecture
- **Maintainability**: Clear structure and TypeScript
- **Security**: Environment isolation and secure storage
- **Developer Experience**: Modern tooling and hot reload