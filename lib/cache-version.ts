/**
 * Cache version manager for portfolio data
 * This helps bypass stale unstable_cache by tracking when data changes
 */

let portfolioCacheVersion = Date.now()

export function getPortfolioCacheVersion(): number {
  return portfolioCacheVersion
}

export function invalidatePortfolioCache(): void {
  portfolioCacheVersion = Date.now()
  console.log(`Portfolio cache version updated to: ${portfolioCacheVersion}`)
}

// Store version in a global that persists across requests in dev mode
if (typeof global !== 'undefined') {
  if (!global.portfolioCacheVersion) {
    global.portfolioCacheVersion = Date.now()
  }
  portfolioCacheVersion = global.portfolioCacheVersion
}

export function updateGlobalCacheVersion(): void {
  portfolioCacheVersion = Date.now()
  if (typeof global !== 'undefined') {
    global.portfolioCacheVersion = portfolioCacheVersion
  }
}