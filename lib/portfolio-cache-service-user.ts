/**
 * User-Aware Portfolio Graph Data Caching Service
 * 
 * This service provides specialized caching for portfolio graph data per user,
 * ensuring complete data isolation between users.
 */

import cacheManager, { CacheKey, CacheEvent } from './cache-manager'
import { executeInUserContext } from './db-with-rls'
import { calculateDailyReturns } from './portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'
import { FALLBACK_USD_TO_NZD_RATE } from './constants'
import { generatePortfolioData } from './portfolioServerData'
import { TradeRecord } from '@/types/portfolio'

// Types
interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

interface PortfolioCurrentData {
  holdings: any[]
  exitedPositions: any[]
  summary: any
  lastUpdated: string
}

interface PortfolioComposition {
  compositions: any[]
  lastUpdated: string
}

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  PORTFOLIO_HISTORY: 1200, // 20 minutes
  PORTFOLIO_CURRENT: 1200, // 20 minutes
  PORTFOLIO_COMPOSITION: 1200, // 20 minutes
  STOCK_PRICES: 300, // 5 minutes for more volatile data
  TRADE_DATA: 1200 // 20 minutes
}

/**
 * Get user's trade data from database
 */
async function getUserTradeData(userId: string): Promise<TradeRecord[]> {
  return executeInUserContext(userId, async (sql) => {
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
        user_id
      FROM application.trade_data
      WHERE user_id = ${userId}
        AND (deleted_flag = false OR deleted_flag IS NULL)
      ORDER BY date ASC, id ASC
    `
    
    return results.map(row => ({
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
      value: parseFloat(row.value)
    }))
  })
}

/**
 * Get cached trade data for a specific user
 */
async function getCachedUserTradeData(userId: string): Promise<TradeRecord[]> {
  const cacheKey = `trade-data-${userId}` as CacheKey
  
  return cacheManager.getOrSet(
    cacheKey,
    () => getUserTradeData(userId),
    CACHE_TTL.TRADE_DATA
  )
}

/**
 * Calculate portfolio history for a specific user
 */
async function calculateUserPortfolioHistory(userId: string): Promise<DailyPortfolioData[]> {
  try {
    const trades = await getCachedUserTradeData(userId)
    
    if (trades.length === 0) {
      // Return empty array for users with no trades
      return []
    }
    
    // Use the existing calculateDailyReturns function with user's trades
    const dailyReturns = await calculateDailyReturns(trades)
    
    // Transform to the expected format
    return dailyReturns.map(day => ({
      date: day.date,
      portfolioValue: day.portfolioValue,
      costBasis: day.totalCostBasis,
      sp500Value: day.sp500Value
    }))
  } catch (error) {
    logger.error(`Error calculating portfolio history for user ${userId}:`, error)
    return []
  }
}

/**
 * Generate portfolio data for a specific user
 */
async function generateUserPortfolioData(userId: string) {
  try {
    const trades = await getCachedUserTradeData(userId)
    
    if (trades.length === 0) {
      // Return empty portfolio for users with no trades
      return {
        holdings: [],
        exitedPositions: [],
        summary: {
          totalValue: 0,
          totalCost: 0,
          totalGain: 0,
          totalGainPercent: 0
        }
      }
    }
    
    // Use the existing generatePortfolioData function with user's trades
    return await generatePortfolioData(trades)
  } catch (error) {
    logger.error(`Error generating portfolio data for user ${userId}:`, error)
    return {
      holdings: [],
      exitedPositions: [],
      summary: {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0
      }
    }
  }
}

/**
 * Get cached portfolio history for a specific user
 */
export async function getCachedUserPortfolioHistory(userId: string): Promise<DailyPortfolioData[]> {
  const cacheKey = `portfolio-history-${userId}` as CacheKey
  
  return cacheManager.getOrSet(
    cacheKey,
    () => calculateUserPortfolioHistory(userId),
    CACHE_TTL.PORTFOLIO_HISTORY
  )
}

/**
 * Get cached current portfolio data for a specific user
 */
export async function getCachedUserPortfolioCurrentData(userId: string): Promise<PortfolioCurrentData> {
  const cacheKey = `portfolio-current-${userId}` as CacheKey
  
  return cacheManager.getOrSet(
    cacheKey,
    async () => {
      const { holdings, exitedPositions } = await generateUserPortfolioData(userId)
      
      // Calculate summary data with proper error handling
      const totalValue = holdings.reduce((sum, h) => {
        const value = h.currentValueNZD || 0
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
      
      const totalCost = holdings.reduce((sum, h) => {
        const cost = h.costBasisNZD || 0
        return sum + (isNaN(cost) ? 0 : cost)
      }, 0)
      
      const totalGain = totalValue - totalCost
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      
      return {
        holdings,
        exitedPositions,
        summary: {
          totalValue: isNaN(totalValue) ? 0 : totalValue,
          totalCost: isNaN(totalCost) ? 0 : totalCost,
          totalGain: isNaN(totalGain) ? 0 : totalGain,
          totalGainPercent: isNaN(totalGainPercent) ? 0 : totalGainPercent
        },
        lastUpdated: new Date().toISOString()
      }
    },
    CACHE_TTL.PORTFOLIO_CURRENT
  )
}

/**
 * Get cached portfolio composition data for a specific user
 */
export async function getCachedUserPortfolioComposition(userId: string): Promise<PortfolioComposition> {
  const cacheKey = `portfolio-composition-${userId}` as CacheKey
  
  return cacheManager.getOrSet(
    cacheKey,
    async () => {
      const { holdings } = await getCachedUserPortfolioCurrentData(userId)
      
      // Calculate composition percentages with proper error handling
      const totalValue = holdings.reduce((sum, h) => {
        const value = h.currentValueNZD || 0
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
      
      const compositions = holdings.map(h => {
        const value = h.currentValueNZD || 0
        const percentage = totalValue > 0 && !isNaN(value) ? (value / totalValue) * 100 : 0
        
        return {
          symbol: h.symbol,
          name: h.name,
          value: isNaN(value) ? 0 : value,
          percentage: isNaN(percentage) ? 0 : percentage,
          color: h.color || '#000000'
        }
      })
      
      // Sort by percentage descending
      compositions.sort((a, b) => b.percentage - a.percentage)
      
      return {
        compositions,
        lastUpdated: new Date().toISOString()
      }
    },
    CACHE_TTL.PORTFOLIO_COMPOSITION
  )
}

/**
 * Invalidate all portfolio caches for a specific user
 */
export async function invalidateUserPortfolioCaches(userId: string): Promise<void> {
  const userCacheKeys = [
    `portfolio-history-${userId}`,
    `portfolio-current-${userId}`,
    `portfolio-composition-${userId}`,
    `trade-data-${userId}`
  ]
  
  for (const key of userCacheKeys) {
    await cacheManager.invalidate(key as CacheKey)
  }
  
  logger.info(`Invalidated all portfolio caches for user ${userId}`)
}

/**
 * Warm up portfolio caches for a specific user
 */
export async function warmUpUserPortfolioCaches(userId: string): Promise<void> {
  try {
    logger.info(`Warming up portfolio caches for user ${userId}...`)
    const startTime = Date.now()
    
    // Pre-fetch all portfolio data in parallel
    await Promise.all([
      getCachedUserPortfolioHistory(userId),
      getCachedUserPortfolioCurrentData(userId),
      getCachedUserPortfolioComposition(userId)
    ])
    
    const duration = Date.now() - startTime
    logger.info(`Portfolio caches warmed up for user ${userId} in ${duration}ms`)
  } catch (error) {
    logger.error(`Error warming up portfolio caches for user ${userId}:`, error)
  }
}

// Export the service
export default {
  getCachedUserTradeData,
  getCachedUserPortfolioHistory,
  getCachedUserPortfolioCurrentData,
  getCachedUserPortfolioComposition,
  invalidateUserPortfolioCaches,
  warmUpUserPortfolioCaches
}