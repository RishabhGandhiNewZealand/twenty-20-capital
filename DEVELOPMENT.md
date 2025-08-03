# Development Guide

This guide provides comprehensive information for developers working on the Personal Portfolio Tracker application.

## Getting Started

### Prerequisites

- **Node.js**: Version 18.17 or later
- **npm** or **pnpm**: Package manager
- **Git**: Version control
- **VS Code** (recommended) or your preferred IDE

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/portfolio-tracker.git
   cd portfolio-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   BLOB_READ_WRITE_TOKEN=your_token_here
   TRADE_DATA_BLOB_URL=your_blob_url_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Development Workflow

### Branch Strategy

We follow a simplified Git flow:

```
main (production)
  └── feature/your-feature-name
  └── fix/bug-description
  └── docs/documentation-update
```

**Creating a new feature:**
```bash
git checkout -b feature/portfolio-export
# Make changes
git add .
git commit -m "feat: add portfolio export functionality"
git push origin feature/portfolio-export
```

### Commit Convention

We use conventional commits for clear history:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

**Examples:**
```bash
git commit -m "feat: add real-time price updates"
git commit -m "fix: correct portfolio calculation error"
git commit -m "docs: update API documentation"
```

### Code Review Process

1. **Create a Pull Request**
2. **Automated checks run** (linting, type checking)
3. **Request review** from team members
4. **Address feedback**
5. **Merge when approved**

## Project Structure

### Directory Organization

```
portfolio-tracker/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and helpers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/               # Static assets
└── styles/               # Global styles
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `PortfolioChart.tsx`)
- **Utilities**: camelCase (e.g., `calculateReturns.ts`)
- **Types**: PascalCase with `.ts` extension
- **Styles**: kebab-case (e.g., `portfolio-chart.module.css`)

## Development Guidelines

### TypeScript Best Practices

1. **Always use strict types:**
   ```typescript
   // ❌ Avoid
   function calculate(data: any) { }
   
   // ✅ Prefer
   function calculate(data: PortfolioData) { }
   ```

2. **Define interfaces for props:**
   ```typescript
   interface ButtonProps {
     variant?: 'primary' | 'secondary'
     onClick?: () => void
     children: React.ReactNode
   }
   ```

3. **Use type inference when possible:**
   ```typescript
   // Let TypeScript infer the type
   const [count, setCount] = useState(0)
   ```

### React Best Practices

1. **Prefer function components:**
   ```typescript
   export function Portfolio({ data }: PortfolioProps) {
     return <div>{/* content */}</div>
   }
   ```

2. **Use hooks effectively:**
   ```typescript
   // Custom hook for data fetching
   function usePortfolioData() {
     const [data, setData] = useState<PortfolioData>()
     const [loading, setLoading] = useState(true)
     
     useEffect(() => {
       fetchPortfolioData().then(setData).finally(() => setLoading(false))
     }, [])
     
     return { data, loading }
   }
   ```

3. **Memoize expensive operations:**
   ```typescript
   const chartData = useMemo(() => 
     processPortfolioData(rawData), 
     [rawData]
   )
   ```

### Styling Guidelines

1. **Use Tailwind CSS classes:**
   ```tsx
   <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
   ```

2. **Component-specific styles with CSS Modules:**
   ```css
   /* portfolio.module.css */
   .container {
     @apply flex flex-col gap-4;
   }
   ```

3. **Responsive design:**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

### API Development

1. **Route structure:**
   ```typescript
   // app/api/portfolio/route.ts
   export async function GET(request: Request) {
     // Handle GET requests
   }
   
   export async function POST(request: Request) {
     // Handle POST requests
   }
   ```

2. **Error handling:**
   ```typescript
   try {
     const data = await fetchData()
     return NextResponse.json(data)
   } catch (error) {
     logger.error('API Error:', error)
     return NextResponse.json(
       { error: 'Internal Server Error' },
       { status: 500 }
     )
   }
   ```

3. **Input validation:**
   ```typescript
   const schema = z.object({
     symbol: z.string().min(1).max(10),
     quantity: z.number().positive()
   })
   
   const result = schema.safeParse(body)
   if (!result.success) {
     return NextResponse.json(
       { error: result.error },
       { status: 400 }
     )
   }
   ```

## Testing

### Unit Testing

```typescript
// lib/calculations.test.ts
import { calculateCAGR } from './calculations'

describe('calculateCAGR', () => {
  it('calculates correct CAGR', () => {
    const result = calculateCAGR(1000, 2000, 5)
    expect(result).toBeCloseTo(14.87, 2)
  })
})
```

### Component Testing

```typescript
// components/Portfolio.test.tsx
import { render, screen } from '@testing-library/react'
import { Portfolio } from './Portfolio'

test('renders portfolio value', () => {
  render(<Portfolio value={150000} />)
  expect(screen.getByText('$150,000')).toBeInTheDocument()
})
```

### API Testing

```typescript
// app/api/portfolio/route.test.ts
import { GET } from './route'

test('returns portfolio data', async () => {
  const response = await GET(new Request('http://localhost'))
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data).toHaveProperty('holdings')
})
```

## Local Development Tools

### VS Code Extensions

Recommended extensions for the project:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Debugging

1. **Next.js debugging config:**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js: debug",
         "type": "node-terminal",
         "request": "launch",
         "command": "npm run dev",
         "serverReadyAction": {
           "pattern": "started server on .+, url: (https?://.+)",
           "uriFormat": "%s",
           "action": "debugWithChrome"
         }
       }
     ]
   }
   ```

2. **Using console logs:**
   ```typescript
   import { logger } from '@/lib/logger'
   
   logger.info('Portfolio calculated', { value, holdings })
   ```

### Performance Profiling

1. **Bundle analysis:**
   ```bash
   npm run analyze
   ```

2. **React DevTools Profiler**
   - Install React DevTools extension
   - Use Profiler tab to identify performance issues

## Common Tasks

### Adding a New API Endpoint

1. **Create route file:**
   ```bash
   mkdir -p app/api/new-endpoint
   touch app/api/new-endpoint/route.ts
   ```

2. **Implement handler:**
   ```typescript
   import { NextResponse } from 'next/server'
   
   export async function GET() {
     // Implementation
     return NextResponse.json({ data: 'value' })
   }
   ```

3. **Add types:**
   ```typescript
   // types/api.ts
   export interface NewEndpointResponse {
     data: string
   }
   ```

### Creating a New Component

1. **Component file:**
   ```typescript
   // components/NewComponent.tsx
   interface NewComponentProps {
     title: string
   }
   
   export function NewComponent({ title }: NewComponentProps) {
     return <div>{title}</div>
   }
   ```

2. **Add to page:**
   ```typescript
   import { NewComponent } from '@/components/NewComponent'
   
   export default function Page() {
     return <NewComponent title="Hello" />
   }
   ```

### Updating Dependencies

1. **Check outdated packages:**
   ```bash
   npm outdated
   ```

2. **Update dependencies:**
   ```bash
   # Update all
   npm update
   
   # Update specific
   npm install package@latest
   ```

3. **Test after updates:**
   ```bash
   npm run build
   npm run test
   ```

## Troubleshooting

### Common Issues

#### TypeScript Errors

**Problem**: Type errors in IDE but not in build
**Solution**: Restart TypeScript server in VS Code (Cmd+Shift+P → "Restart TS Server")

#### Module Not Found

**Problem**: Cannot find module errors
**Solution**: 
```bash
rm -rf node_modules .next
npm install
npm run dev
```

#### Environment Variables

**Problem**: Environment variables not loading
**Solution**: 
- Ensure `.env.local` exists
- Restart dev server after changes
- Check variable names match exactly

### Debug Mode

Enable verbose logging:

```typescript
// lib/debug.ts
export const DEBUG = process.env.NODE_ENV === 'development'

export function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args)
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // Disable SSR if not needed
})
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

### Data Fetching

```typescript
// Parallel data fetching
const [portfolio, prices] = await Promise.all([
  fetchPortfolio(),
  fetchPrices()
])
```

## Contributing

### Before Submitting PR

- [ ] Run `npm run lint` and fix issues
- [ ] Run `npm run build` successfully
- [ ] Add/update tests if needed
- [ ] Update documentation if needed
- [ ] Test on mobile viewport
- [ ] Check bundle size impact

### Code Quality Checklist

- [ ] No `any` types without justification
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Responsive design tested
- [ ] Accessibility considered
- [ ] Performance optimized

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Learning Resources

- [Next.js Learn Course](https://nextjs.org/learn)
- [React Patterns](https://reactpatterns.com)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript)

### Tools

- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Support

For development questions:

1. Check existing documentation
2. Search closed issues on GitHub
3. Ask in development chat
4. Create a new issue with details

Happy coding! 🚀