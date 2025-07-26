// Portfolio inception date
export const PORTFOLIO_INCEPTION_DATE = new Date('2023-09-01')

// Calculate years since inception dynamically
export function getYearsSinceInception(currentDate: Date = new Date()): number {
  const diffMs = currentDate.getTime() - PORTFOLIO_INCEPTION_DATE.getTime()
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)
  return Math.round(diffYears * 100) / 100 // Round to 2 decimal places
}

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  PORTFOLIO_HISTORY: 5 * 60 * 1000, // 5 minutes
  STOCK_PRICE: 60 * 1000, // 1 minute
  EXCHANGE_RATE: 10 * 60 * 1000, // 10 minutes
}

// Cache revalidation times (in seconds for Next.js)
export const CACHE_REVALIDATE = {
  STOCK_PRICE: 300, // 5 minutes
  EXCHANGE_RATE: 3600, // 1 hour
}

// Fallback exchange rates
export const FALLBACK_USD_TO_NZD_RATE = 1.78
export const FALLBACK_NZD_TO_USD_RATE = 0.56 // 1 / 1.78

// Portfolio thresholds
export const MIN_SHARE_THRESHOLD = 0.001 // Minimum shares to keep a position