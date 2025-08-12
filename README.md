# Personal Portfolio Tracker

A sophisticated portfolio tracking application built with Next.js 15, TypeScript, and Tailwind CSS that provides real-time investment monitoring, performance analytics, and comprehensive reporting capabilities.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)

## Overview

This application serves as a comprehensive personal investment portfolio tracker designed for individual investors who want to monitor their investments, track performance against benchmarks, and gain insights into their portfolio composition. The system provides real-time market data integration, multi-currency support, and advanced analytics while maintaining a clean, responsive user interface.

## Key Features

### Portfolio Management
- **Real-time Portfolio Valuation**: Live market data integration with Yahoo Finance API
- **Multi-Currency Support**: Automatic conversion to NZD with support for USD and other currencies
- **Transaction Tracking**: Complete buy/sell/reinvestment transaction history
- **Trade Management Interface**: Add, edit, and delete trades with staged changes
- **Position Management**: Current holdings with cost basis and gain/loss calculations
- **Exited Positions**: Historical tracking of closed positions with realized gains

### Performance Analytics
- **S&P 500 Benchmarking**: Compare portfolio performance against market index
- **CAGR Calculations**: Compound Annual Growth Rate metrics
- **Performance Visualization**: Interactive charts showing portfolio value over time
- **Gain/Loss Analysis**: Detailed breakdown of unrealized and realized gains
- **Allocation Insights**: Visual representation of portfolio composition

### Reporting & Analysis
- **Quarterly Reports**: Automated quarterly performance summaries
- **Annual Reviews**: Comprehensive yearly portfolio analysis
- **Company Analysis**: Dedicated pages for in-depth company research
- **News Integration**: AI-powered news analysis using Google Gemini API

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Anonymization Mode**: Password-protected privacy mode for sharing
- **Dark Mode Support**: System-aware theme switching
- **Performance Optimized**: Server-side rendering with intelligent caching
- **Accessibility**: WCAG compliant with keyboard navigation support

## Architecture

The application follows a modern, scalable architecture leveraging Next.js 15's App Router:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Application                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         React Server Components (Default)            │   │
│  │         Client Components (Interactive UI)           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Routes (Edge Functions)             │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │Vercel    │  │Yahoo Finance │  │Google Gemini    │     │
│  │Blob      │  │API           │  │API              │     │
│  └──────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

- **Server Components by Default**: Reduced client bundle size and improved performance
- **Data Fetching at Request Time**: Fresh data with intelligent caching
- **Type-Safe Development**: Full TypeScript coverage with strict typing
- **Modular Architecture**: Clear separation of concerns with reusable components
- **Edge Computing**: API routes deployed as edge functions for global performance

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library
- **Recharts**: Data visualization
- **Lucide Icons**: Modern icon set

### Backend
- **Next.js API Routes**: Serverless functions
- **Neon Database**: PostgreSQL database for trade data
- **Node.js**: Server runtime

### External Services
- **Yahoo Finance API**: Real-time market data
- **Google Gemini API**: AI-powered news analysis
- **Vercel**: Hosting and deployment

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **pnpm**: Package management

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm
- Vercel account for deployment
- Neon database with trade data

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Connection
DATABASE_URL=your_neon_database_url

# Optional: AI News Analysis
GEMINI_API_KEY=your_gemini_api_key

# Optional: Admin Password for Anonymization
ADMIN_PASSWORD=your_admin_password
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/portfolio-tracker.git
cd portfolio-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Schema

The application uses a PostgreSQL database with trade data stored in the `application.trade_data` table with columns for:
- Trade details (code, name, date, type, quantity, price)
- Currency information (instrument_currency, brokerage_currency, exchange_rate)
- Transaction values and fees

## Project Structure

```
/workspace
├── app/                        # Next.js App Router
│   ├── api/                   # API endpoints
│   │   ├── portfolio/         # Portfolio data endpoints
│   │   ├── portfolio-current/ # Current portfolio summary
│   │   ├── portfolio-history/ # Historical data
│   │   ├── stock-price/       # Real-time prices
│   │   ├── exchange-rate/     # Currency conversion
│   │   └── news/             # News analysis
│   ├── analyses/             # Company analysis pages
│   ├── reports/              # Quarterly/annual reports
│   ├── portfolio/            # Portfolio page
│   ├── trades/              # Trade management page
│   ├── news/                # AI-powered news analysis
│   ├── about/               # About page
│   └── page.tsx             # Home dashboard
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── portfolio-chart.tsx # Performance charts
│   └── app-sidebar.tsx     # Navigation
├── lib/                    # Core business logic
│   ├── portfolio.ts        # Portfolio calculations
│   ├── portfolio-cache-service.ts # Caching layer
│   ├── financial-calculations.ts # Financial metrics
│   ├── db.ts              # Database connection
│   ├── trade-data-cache.ts # Trade data access
│   └── anonymization-utils.ts # Privacy features
├── contexts/               # React contexts
│   └── AnonymizationContext.tsx
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
├── scripts/                # Build scripts
├── docs/                   # Documentation
└── public/                 # Static assets
```

## API Documentation

### Core Endpoints

#### Portfolio Data
- `GET /api/portfolio` - Complete portfolio data with holdings and exited positions
- `GET /api/portfolio-current` - Real-time portfolio summary
- `GET /api/portfolio-history` - Historical data for charts
- `GET /api/portfolio-compositions` - Historical portfolio compositions

#### Trade Management
- `GET /api/trades` - Fetch all trades from database
- `POST /api/trades` - Create new trade
- `PUT /api/trades/[id]` - Update existing trade
- `DELETE /api/trades/[id]` - Delete trade
- `POST /api/trades/batch` - Batch update trades

#### Market Data
- `GET /api/stock-price/[symbol]` - Current stock price
- `GET /api/exchange-rate` - USD to NZD conversion rate

#### News & Analysis
- `POST /api/news/analyze` - AI-powered news analysis
- `GET /api/news/[symbol]` - Company-specific news

#### Cache Management
- `POST /api/cache/bust` - Clear specific cache keys
- `POST /api/cache/warmup` - Pre-warm cache with data

### Response Formats

All API responses follow a consistent JSON structure:

```json
{
  "data": {},
  "lastUpdated": "2024-01-15T10:30:00Z",
  "cached": false,
  "error": null
}
```

## Security Features

### Anonymization System
- **Privacy Mode**: Hide sensitive financial data with asterisks
- **Password Protection**: Admin password required to view actual data
- **Secure Storage**: Environment variables for sensitive configuration
- **Default Anonymized**: System defaults to anonymized mode for security

### Data Protection
- **Server-Side Processing**: Sensitive calculations happen server-side
- **Environment Variables**: Credentials stored securely
- **HTTPS Only**: Enforced secure connections in production
- **Input Validation**: All user inputs are validated and sanitized

## Performance Optimizations

### Caching Strategy
- **Multi-Layer Caching**: Memory cache with TTL-based expiration
- **Smart Invalidation**: Event-based cache busting for data changes
- **Build-Time Optimization**: Pre-calculated portfolio compositions
- **API Response Caching**: 5-minute cache for market data

### Frontend Optimizations
- **Server Components**: Reduced client JavaScript bundle
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Size**: Optimized dependencies (~350KB reduction)

### Backend Optimizations
- **Parallel API Calls**: 60-70% faster data loading
- **Edge Functions**: Global deployment for low latency
- **Efficient Calculations**: Optimized portfolio processing algorithms

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import repository to Vercel
3. Configure environment variables
4. Deploy with one click

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

### Code Standards

- TypeScript for all new code
- Follow existing patterns
- Add JSDoc comments for public functions
- Update documentation for new features

### Testing

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

## Documentation

Detailed documentation is available in the `/docs` folder:

- **[Architecture](docs/ARCHITECTURE.md)** - System design and patterns
- **[Development](docs/DEVELOPMENT.md)** - Development guide
- **[Deployment](docs/DEPLOYMENT.md)** - Deployment instructions
- **[API](docs/API.md)** - API endpoint documentation
- **[Components](docs/COMPONENTS.md)** - Component documentation
- **[Anonymization](docs/ANONYMIZATION_FEATURE.md)** - Privacy feature details
- **[Caching](docs/CACHE_BUSTING_DOCUMENTATION.md)** - Cache system documentation

## Recent Updates

### January 2025
- Fixed S&P 500 performance calculation anomalies
- Organized documentation structure
- Enhanced README with comprehensive project information
- Removed emojis from documentation for professional presentation

### Performance Improvements
- Implemented parallel API calls (60-70% faster loading)
- Added intelligent caching system
- Optimized bundle size (350KB reduction)
- Enhanced mobile responsiveness

### Code Quality
- Added comprehensive JSDoc documentation
- Implemented Prettier for consistent formatting
- Reduced code duplication through shared utilities
- Improved TypeScript type coverage

## License

This project is proprietary software. All rights reserved.

## Support

For questions or issues, please refer to the documentation in the `/docs` folder or create an issue in the repository.

---

Built with passion for personal finance tracking and portfolio management.
