import { unstable_cache } from 'next/cache'
import { getDb } from './db'
import { logger } from './logger'
import { TradeRecord } from '@/types/portfolio'
import { ANONYMIZATION_CONSTANT } from './anonymization-constant'

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 3600 // 1 hour
const CACHE_TAG = 'trade-data'

/**
 * Fetches all trade data from the database
 * This is the raw database query function
 */
async function fetchTradeDataFromDB(): Promise<TradeRecord[]> {
  const sql = getDb()
  
  try {
    const results = await sql`
      SELECT 
        code,
        market_code,
        name,
        date,
        type,
        qty,
        price,
        instrument_currency,
        brokerage,
        brokerage_currency,
        exch_rate,
        value
      FROM application.trade_data
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    // Apply anonymization to financial values
    const trades: TradeRecord[] = results.map(row => ({
      code: row.code,
      marketCode: row.market_code,
      name: row.name,
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      type: row.type as 'Buy' | 'Sell' | 'Reinvestment',
      qty: parseFloat(row.qty) * ANONYMIZATION_CONSTANT,  // Anonymize quantity
      price: parseFloat(row.price) * ANONYMIZATION_CONSTANT,  // Anonymize price
      instrumentCurrency: row.instrument_currency,
      brokerage: parseFloat(row.brokerage) * ANONYMIZATION_CONSTANT,  // Anonymize brokerage
      brokerageCurrency: row.brokerage_currency,
      exchRate: parseFloat(row.exch_rate),  // Keep exchange rate as-is (market data)
      value: parseFloat(row.value) * ANONYMIZATION_CONSTANT  // Anonymize value
    }))
    
    logger.info(`Fetched and anonymized ${trades.length} trades from database`)
    return trades
    
  } catch (error) {
    logger.error('Error fetching trade data from database:', error)
    throw error
  }
}

/**
 * Cached version of fetchTradeDataFromDB
 * This function will cache the results for the specified duration
 * and serve from cache on subsequent calls within the same session
 */
export const getCachedTradeData = unstable_cache(
  fetchTradeDataFromDB,
  [CACHE_TAG], // Cache key
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAG]
  }
)

/**
 * Fetches trade data for a specific symbol
 * This is useful for symbol-specific queries
 */
async function fetchTradeDataBySymbolFromDB(symbol: string): Promise<TradeRecord[]> {
  const sql = getDb()
  
  try {
    const results = await sql`
      SELECT 
        code,
        market_code,
        name,
        date,
        type,
        qty,
        price,
        instrument_currency,
        brokerage,
        brokerage_currency,
        exch_rate,
        value
      FROM application.trade_data
      WHERE code = ${symbol}
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    // Apply anonymization to financial values
    const trades: TradeRecord[] = results.map(row => ({
      code: row.code,
      marketCode: row.market_code,
      name: row.name,
      date: row.date.toISOString().split('T')[0],
      type: row.type as 'Buy' | 'Sell' | 'Reinvestment',
      qty: parseFloat(row.qty) * ANONYMIZATION_CONSTANT,  // Anonymize quantity
      price: parseFloat(row.price) * ANONYMIZATION_CONSTANT,  // Anonymize price
      instrumentCurrency: row.instrument_currency,
      brokerage: parseFloat(row.brokerage) * ANONYMIZATION_CONSTANT,  // Anonymize brokerage
      brokerageCurrency: row.brokerage_currency,
      exchRate: parseFloat(row.exch_rate),  // Keep exchange rate as-is (market data)
      value: parseFloat(row.value) * ANONYMIZATION_CONSTANT  // Anonymize value
    }))
    
    logger.info(`Fetched and anonymized ${trades.length} trades for symbol ${symbol} from database`)
    return trades
    
  } catch (error) {
    logger.error(`Error fetching trade data for symbol ${symbol}:`, error)
    throw error
  }
}

/**
 * Cached version of fetchTradeDataBySymbolFromDB
 */
export const getCachedTradeDataBySymbol = unstable_cache(
  fetchTradeDataBySymbolFromDB,
  [`${CACHE_TAG}-symbol`], // Cache key prefix
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAG]
  }
)

/**
 * Invalidates the trade data cache
 * This should be called when trade data is updated
 */
export async function invalidateTradeDataCache() {
  try {
    const { revalidateTag } = await import('next/cache')
    await revalidateTag(CACHE_TAG)
    logger.info('Trade data cache invalidated')
  } catch (error) {
    logger.error('Error invalidating trade data cache:', error)
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getTradeDataCacheStats() {
  const sql = getDb()
  
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT code) as unique_symbols,
        MIN(date) as earliest_trade,
        MAX(date) as latest_trade,
        MAX(updated_at) as last_updated
      FROM application.trade_data
    `
    
    return {
      totalTrades: stats[0].total_trades,
      uniqueSymbols: stats[0].unique_symbols,
      earliestTrade: stats[0].earliest_trade,
      latestTrade: stats[0].latest_trade,
      lastUpdated: stats[0].last_updated,
      cacheRevalidateSeconds: CACHE_REVALIDATE_SECONDS
    }
    
  } catch (error) {
    logger.error('Error getting trade data cache stats:', error)
    throw error
  }
}