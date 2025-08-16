import { getDb } from './db'
import { logger } from './logger'
import { TradeRecord } from '@/types/portfolio'

/**
 * Fetches all trade data from the database for a specific user
 * This is the raw database query function
 */
async function fetchTradeDataFromDB(userId?: string): Promise<TradeRecord[]> {
  const sql = getDb()
  
  try {
    const results = await sql`
      SELECT 
        id,
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
        value,
        user_id,
        deleted_flag,
        deleted_at,
        created_at,
        updated_at
      FROM application.trade_data
      WHERE (deleted_flag = FALSE OR deleted_flag IS NULL)
      ${userId ? sql`AND user_id = ${userId}` : sql``}
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    const trades: TradeRecord[] = results.map(row => ({
      id: row.id,
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
      value: parseFloat(row.value),
      deleted_flag: row.deleted_flag || false,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
      updated_at: row.updated_at ? row.updated_at.toISOString() : undefined,
      user_id: row.user_id
    }))
    
    logger.info(`Fetched ${trades.length} trades from database for user scope`)
    return trades
    
  } catch (error) {
    logger.error('Error fetching trade data from database:', error)
    throw error
  }
}

/**
 * Direct version of fetchTradeDataFromDB without caching
 * Always fetches fresh data from the database
 */
export const getCachedTradeData = fetchTradeDataFromDB

/**
 * Fetches trade data for a specific symbol (scoped to user)
 * This is useful for symbol-specific queries
 */
async function fetchTradeDataBySymbolFromDB(symbol: string, userId?: string): Promise<TradeRecord[]> {
  const sql = getDb()
  
  try {
    const results = await sql`
      SELECT 
        id,
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
        value,
        user_id,
        deleted_flag,
        deleted_at,
        created_at,
        updated_at
      FROM application.trade_data
      WHERE code = ${symbol} 
        AND (deleted_flag = FALSE OR deleted_flag IS NULL)
        ${userId ? sql`AND user_id = ${userId}` : sql``}
      ORDER BY date ASC, id ASC
    `
    
    // Transform database results to match TradeRecord interface
    const trades: TradeRecord[] = results.map(row => ({
      id: row.id,
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
      value: parseFloat(row.value),
      deleted_flag: row.deleted_flag || false,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
      updated_at: row.updated_at ? row.updated_at.toISOString() : undefined,
      user_id: row.user_id
    }))
    
    logger.info(`Fetched ${trades.length} trades for symbol ${symbol} (user scoped) from database`)
    return trades
    
  } catch (error) {
    logger.error(`Error fetching trade data for symbol ${symbol}:`, error)
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
      cacheRevalidateSeconds: 1200 // 20 minutes
    }
    
  } catch (error) {
    logger.error('Error getting trade data cache stats:', error)
    throw error
  }
}