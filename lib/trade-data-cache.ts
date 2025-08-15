import { getDb } from './db'
import { getAdminDb, getAdminUserId, getUserDb } from './rls-auth'
import { logger } from './logger'
import { TradeRecord } from '@/types/portfolio'

/**
 * Fetches all trade data from the database for the admin user
 * This is used for portfolio pages which show admin's portfolio
 * Now uses admin's user ID to fetch only admin trades
 */
async function fetchTradeDataFromDB(): Promise<TradeRecord[]> {
  // Get admin user ID
  const adminUserId = getAdminUserId()
  
  if (!adminUserId) {
    logger.warn('ADMIN_USER_ID not set - portfolio pages will show no data')
    return []
  }
  
  // Use admin's user-specific connection to get only admin trades
  const sql = getUserDb(adminUserId)
  
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
      WHERE deleted_flag = FALSE OR deleted_flag IS NULL
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    const trades: TradeRecord[] = results.map(row => ({
      code: row.code,
      marketCode: row.market_code,
      name: row.name,
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      type: row.type as 'Buy' | 'Sell' | 'Reinvestment',
      qty: parseFloat(row.qty),
      price: parseFloat(row.price),
      instrumentCurrency: row.instrument_currency,
      brokerage: parseFloat(row.brokerage),
      brokerageCurrency: row.brokerage_currency,
      exchRate: parseFloat(row.exch_rate),
      value: parseFloat(row.value)
    }))
    
    logger.info(`Fetched ${trades.length} admin trades for portfolio from database`)
    return trades
    
  } catch (error) {
    logger.error('Error fetching admin trade data from database:', error)
    throw error
  }
}

/**
 * Direct version of fetchTradeDataFromDB without caching
 * Always fetches fresh data from the database
 */
export const getCachedTradeData = fetchTradeDataFromDB

/**
 * Fetches trade data for a specific symbol for the admin user
 * This is useful for symbol-specific queries in portfolio pages
 * Now uses admin's user ID to fetch only admin trades
 */
async function fetchTradeDataBySymbolFromDB(symbol: string): Promise<TradeRecord[]> {
  // Get admin user ID
  const adminUserId = getAdminUserId()
  
  if (!adminUserId) {
    logger.warn('ADMIN_USER_ID not set - portfolio pages will show no data')
    return []
  }
  
  // Use admin's user-specific connection to get only admin trades
  const sql = getUserDb(adminUserId)
  
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
      WHERE code = ${symbol} AND (deleted_flag = FALSE OR deleted_flag IS NULL)
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    const trades: TradeRecord[] = results.map(row => ({
      code: row.code,
      marketCode: row.market_code,
      name: row.name,
      date: row.date.toISOString().split('T')[0],
      type: row.type as 'Buy' | 'Sell' | 'Reinvestment',
      qty: parseFloat(row.qty),
      price: parseFloat(row.price),
      instrumentCurrency: row.instrument_currency,
      brokerage: parseFloat(row.brokerage),
      brokerageCurrency: row.brokerage_currency,
      exchRate: parseFloat(row.exch_rate),
      value: parseFloat(row.value)
    }))
    
    logger.info(`Fetched ${trades.length} admin trades for symbol ${symbol} from database`)
    return trades
    
  } catch (error) {
    logger.error(`Error fetching admin trade data for symbol ${symbol}:`, error)
    throw error
  }
}

/**
 * Direct version of fetchTradeDataBySymbolFromDB without caching
 */
export const getCachedTradeDataBySymbol = fetchTradeDataBySymbolFromDB

/**
 * No-op function since caching is disabled
 * Kept for backward compatibility
 */
export async function invalidateTradeDataCache() {
  // No caching, so nothing to invalidate
  logger.info('Cache invalidation called (no-op, caching disabled)')
}

/**
 * Get cache statistics for monitoring
 * Now uses admin's user ID to get stats for admin trades only
 */
export async function getTradeDataCacheStats() {
  // Get admin user ID
  const adminUserId = getAdminUserId()
  
  if (!adminUserId) {
    logger.warn('ADMIN_USER_ID not set - cannot get cache stats')
    return {
      totalTrades: 0,
      uniqueSymbols: 0,
      earliestTrade: null,
      latestTrade: null,
      lastUpdated: null,
      cacheRevalidateSeconds: 1200
    }
  }
  
  // Use admin's user-specific connection
  const sql = getUserDb(adminUserId)
  
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT code) as unique_symbols,
        MIN(date) as earliest_trade,
        MAX(date) as latest_trade,
        MAX(updated_at) as last_updated
      FROM application.trade_data
      WHERE (deleted_flag = FALSE OR deleted_flag IS NULL)
    `
    
    return {
      totalTrades: stats[0].total_trades,
      uniqueSymbols: stats[0].unique_symbols,
      earliestTrade: stats[0].earliest_trade,
      latestTrade: stats[0].latest_trade,
      lastUpdated: stats[0].last_updated,
      cacheRevalidateSeconds: 1200 // 20 minutes
    }
    
  } catch (error) {
    logger.error('Error getting trade data cache stats:', error)
    throw error
  }
}