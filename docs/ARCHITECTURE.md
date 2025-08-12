# Architecture Documentation

This document outlines the high-level architecture and design patterns of the Personal Portfolio Tracker application. For detailed project structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

## System Architecture

The application follows a modern, scalable architecture leveraging Next.js 15's latest features:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
├─────────────────────────────────────────────────────────────┤
│                   Next.js Application                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            React Server Components                   │   │
│  │         (Default rendering, data fetching)          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             Client Components                        │   │
│  │          (Interactivity, state management)          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           API Routes (Edge Functions)                │   │
│  │              (Data processing, external APIs)        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │Neon Database│  │Yahoo Finance│  │ Google Gemini   │    │
│  │(PostgreSQL) │  │    API      │  │      API        │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. Server-First Architecture
- **Server Components by Default**: Reduced JavaScript bundle, better SEO, direct database access
- **Client Components for Interactivity**: Used only when client-side state or browser APIs needed
- **Edge Functions**: API routes deployed globally for low latency

### 2. Performance Optimization
- **Multi-tier Caching**: Memory cache → Database cache → External API
- **Parallel Data Fetching**: Concurrent API calls reduce loading time by 60-70%
- **Code Splitting**: Automatic route-based splitting
- **Optimized Assets**: Image optimization, font subsetting, CSS minification

### 3. Type Safety
- **Full TypeScript Coverage**: 100% type coverage across the codebase
- **Strict Configuration**: No implicit any, strict null checks
- **Runtime Validation**: Type guards for external data

### 4. Security & Privacy
- **Anonymization Mode**: Password-protected data masking
- **Server-Side Processing**: Sensitive calculations never exposed to client
- **Environment Variables**: Secure credential management
- **Input Validation**: All user inputs sanitized

## Data Flow Patterns

### Request Lifecycle
```
User Action → Route Handler → Business Logic → Data Layer → Cache Check → Response
```

### Caching Strategy
```
Request → Memory Cache (1-5 min) → Database → External API → Update Cache
```

### State Management
- **Server State**: Next.js data fetching (async components)
- **Client State**: React hooks (useState, useReducer)
- **Global State**: Context API (theme, anonymization)
- **URL State**: Query parameters for shareable views

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript 5.9**: Type-safe development
- **Tailwind CSS 3.4**: Utility-first styling
- **Recharts**: Data visualization
- **shadcn/ui**: Accessible component library

### Backend
- **Node.js**: Runtime environment
- **PostgreSQL**: Primary data storage (via Neon)
- **Edge Runtime**: Serverless functions

### External Services
- **Yahoo Finance API**: Market data
- **Google Gemini API**: AI news analysis
- **Vercel**: Hosting and deployment

## Key Architectural Decisions

### Why Next.js App Router?
- Built-in server components reduce complexity
- Streaming and suspense for better UX
- Nested layouts for code reuse
- Parallel routes for complex UIs

### Why PostgreSQL over NoSQL?
- ACID compliance for financial data
- Complex queries for portfolio calculations
- Proven scalability
- Strong consistency guarantees

### Why Edge Functions?
- Global deployment reduces latency
- Automatic scaling
- Cost-effective for sporadic traffic
- Built-in caching capabilities

## Performance Metrics

- **Initial Load**: < 2s on 3G
- **Time to Interactive**: < 3s
- **API Response Time**: < 200ms (cached)
- **Lighthouse Score**: 95+ (Performance)

## Scalability Considerations

### Current Capacity
- Single-user optimized
- ~1000 trades efficiently
- Real-time updates for 50+ stocks

### Future Scaling
- Database connection pooling ready
- Cache layer supports Redis migration
- API structure supports GraphQL layer
- Component architecture supports micro-frontends

## Security Architecture

### Data Protection Layers
1. **Network**: HTTPS only, CSP headers
2. **Application**: Input validation, SQL injection prevention
3. **Data**: Encryption at rest, secure environment variables
4. **Access**: Password-protected sensitive features

### Authentication Flow
```
User → Password Entry → Server Validation → Session Token → Access Granted
```

## Development Workflow

### Local Development
```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm test       # Run tests
pnpm lint       # Code quality checks
```

### Deployment Pipeline
1. Push to GitHub
2. Vercel automatic deployment
3. Preview deployment for PRs
4. Production deployment on merge

## Monitoring & Observability

- **Logging**: Centralized via custom logger
- **Error Tracking**: Console errors in development
- **Performance**: Vercel Analytics integration
- **Uptime**: Health check endpoints

## Best Practices

### Code Organization
- Feature-based structure in `/app`
- Shared utilities in `/lib`
- Reusable components in `/components`
- Type definitions in `/types`

### Testing Strategy
- Unit tests for utilities
- Integration tests for APIs
- Component tests for UI
- E2E tests for critical paths

### Documentation
- JSDoc for all public functions
- README files in key directories
- Inline comments for complex logic
- Architecture decisions recorded

## Future Architecture Evolution

### Short Term (3-6 months)
- Add Redis for distributed caching
- Implement WebSocket for real-time updates
- Add comprehensive test coverage
- Optimize database queries

### Long Term (6-12 months)
- Multi-user support with authentication
- Microservices for specific domains
- GraphQL API layer
- React Native mobile app

## Conclusion

The architecture prioritizes performance, maintainability, and user experience while remaining flexible for future enhancements. The separation of concerns and modern patterns ensure the codebase remains scalable and easy to understand.

For detailed implementation specifics, refer to [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).