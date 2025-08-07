/**
 * Centralized cache configuration for the application
 */

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Database queries (no external API calls)
  TRADE_DATA: 3600, // 1 hour
  
  // Yahoo Finance API dependent data
  PORTFOLIO_CURRENT: 1200, // 20 minutes
  PORTFOLIO_HISTORY: 1200, // 20 minutes
  PORTFOLIO_COMPOSITIONS: 1200, // 20 minutes
  STOCK_PRICES: 1200, // 20 minutes
  EXCHANGE_RATES: 1200, // 20 minutes
  
  // Other API data
  NEWS_ANALYSIS: 3600, // 1 hour (Gemini API calls are expensive)
} as const

// Cache tags for invalidation
export const CACHE_TAGS = {
  TRADE_DATA: 'trade-data',
  PORTFOLIO_HISTORY: 'portfolio-history',
  PORTFOLIO_COMPOSITIONS: 'portfolio-compositions',
  STOCK_PRICES: 'stock-prices',
  EXCHANGE_RATES: 'exchange-rates',
  NEWS: 'news',
} as const

// HTTP Cache-Control headers
export const CACHE_HEADERS = {
  // For Yahoo Finance dependent endpoints
  YAHOO_FINANCE: {
    'Cache-Control': `public, s-maxage=${CACHE_DURATIONS.PORTFOLIO_CURRENT}, stale-while-revalidate=${CACHE_DURATIONS.PORTFOLIO_CURRENT * 1.5}`,
  },
  
  // For database-only endpoints
  DATABASE_ONLY: {
    'Cache-Control': `public, s-maxage=${CACHE_DURATIONS.TRADE_DATA}, stale-while-revalidate=${CACHE_DURATIONS.TRADE_DATA * 1.5}`,
  },
  
  // For expensive API calls (like news analysis)
  EXPENSIVE_API: {
    'Cache-Control': `public, s-maxage=${CACHE_DURATIONS.NEWS_ANALYSIS}, stale-while-revalidate=${CACHE_DURATIONS.NEWS_ANALYSIS * 2}`,
  },
} as const