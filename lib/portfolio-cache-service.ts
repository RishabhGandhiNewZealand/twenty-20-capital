/**
 * Portfolio Graph Data Caching Service
 * 
 * This service provides specialized caching for portfolio graph data,
 * integrating with the cache manager and handling portfolio-specific logic.
 */

import cacheManager, { CacheKey, CacheEvent } from './cache-manager'
import { getCachedTradeData } from './trade-data-cache'
import { calculateDailyReturns } from './portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'
import { FALLBACK_USD_TO_NZD_RATE } from './constants'
import { generatePortfolioData } from './portfolioServerData'

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
 * Get historical prices for a stock with caching
 */
async function getHistoricalPrices(
  ticker: string, 
  startDate: Date, 
  endDate: Date
): Promise<Map<string, number>> {
  const cacheKey = `${CacheKey.STOCK_PRICES}:${ticker}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`
  
  return cacheManager.getOrSet(
    cacheKey,
    async () => {
      try {
        // Map ticker symbols for Yahoo Finance
        let yfinanceTicker = ticker
        if (ticker === 'MFT') {
          yfinanceTicker = 'MFT.NZ'
        }

        logger.debug(`Fetching history for ${yfinanceTicker} from ${startDate.toISOString()} to ${endDate.toISOString()}`)
        
        const quotes = await yahooFinance.historical(yfinanceTicker, {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        })

        logger.debug(`Got ${quotes.length} quotes for ${yfinanceTicker}`)

        const priceMap = new Map<string, number>()
        quotes.forEach(quote => {
          const dateStr = quote.date.toISOString().split('T')[0]
          priceMap.set(dateStr, quote.close)
        })

        return priceMap
      } catch (error) {
        logger.error(`Error fetching prices for ${ticker}:`, error)
        return new Map()
      }
    },
    CACHE_TTL.STOCK_PRICES
  )
}

/**
 * Get USD/NZD exchange rate with caching
 */
async function getUSDNZDRate(startDate: Date, endDate: Date): Promise<Map<string, number>> {
  const cacheKey = `${CacheKey.STOCK_PRICES}:USDNZD:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`
  
  return cacheManager.getOrSet(
    cacheKey,
    async () => {
      try {
        logger.debug(`Fetching USD/NZD exchange rate from ${startDate.toISOString()} to ${endDate.toISOString()}`)
        
        const quotes = await yahooFinance.historical('NZDUSD=X', {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        })

        logger.debug(`Got ${quotes.length} exchange rate quotes`)

        const rateMap = new Map<string, number>()
        quotes.forEach(quote => {
          const dateStr = quote.date.toISOString().split('T')[0]
          // Convert NZD/USD to USD/NZD by inverting
          rateMap.set(dateStr, 1 / quote.close)
        })

        return rateMap
      } catch (error) {
        logger.error('Error fetching USD/NZD rate:', error)
        // Return fallback rate
        const rateMap = new Map<string, number>()
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0]
          rateMap.set(dateStr, FALLBACK_USD_TO_NZD_RATE)
          currentDate.setDate(currentDate.getDate() + 1)
        }
        return rateMap
      }
    },
    CACHE_TTL.STOCK_PRICES
  )
}

/**
 * Fill forward missing dates in price data
 */
function fillMissingDates(
  priceMap: Map<string, number>, 
  startDate: Date, 
  endDate: Date
): Map<string, number> {
  const filledMap = new Map<string, number>()
  const currentDate = new Date(startDate)
  let lastPrice: number | null = null

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    if (priceMap.has(dateStr)) {
      lastPrice = priceMap.get(dateStr)!
      filledMap.set(dateStr, lastPrice)
    } else if (lastPrice !== null) {
      filledMap.set(dateStr, lastPrice)
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return filledMap
}

/**
 * Calculate portfolio history with caching
 */
async function calculatePortfolioHistory(): Promise<DailyPortfolioData[]> {
  try {
    // Fetch cached trade data
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found for portfolio history')
      return []
    }

    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info('Portfolio history calculation started')
    logger.debug('Date range:', { start: startDate.toISOString(), end: endDate.toISOString() })
    logger.debug('Number of trades:', trades.length)

    // Get unique tickers and currencies
    const tickers = [...new Set(trades.map(t => t.code))]
    const needsExchangeRate = trades.some(t => t.instrumentCurrency === 'USD')

    logger.debug('Unique tickers:', tickers)
    logger.debug('Needs exchange rate:', needsExchangeRate)

    // Fetch all historical data in parallel
    const promises: Promise<any>[] = []
    
    // Add price fetching promises
    tickers.forEach(ticker => {
      promises.push(getHistoricalPrices(ticker, startDate, endDate))
    })
    
    // Add exchange rate if needed
    if (needsExchangeRate) {
      promises.push(getUSDNZDRate(startDate, endDate))
    }
    
    // Add SPY prices for S&P 500 comparison
    promises.push(getHistoricalPrices('SPY', startDate, endDate))

    logger.info('Fetching historical data...')
    const results = await Promise.all(promises)

    // Organize the results
    const tickerPrices = new Map<string, Map<string, number>>()
    tickers.forEach((ticker, index) => {
      tickerPrices.set(ticker, results[index])
    })

    const exchangeRates = needsExchangeRate ? results[tickers.length] : new Map<string, number>()
    const spyPrices = results[results.length - 1]

    logger.info('Filling missing dates...')
    
    // Fill forward missing prices
    const filledPrices = new Map<string, Map<string, number>>()
    tickers.forEach(ticker => {
      const prices = tickerPrices.get(ticker) || new Map()
      filledPrices.set(ticker, fillMissingDates(prices, startDate, endDate))
    })

    const filledExchangeRates = fillMissingDates(exchangeRates, startDate, endDate)
    const filledSpyPrices = fillMissingDates(spyPrices, startDate, endDate)

    logger.info('Calculating daily portfolio values...')
    
    // Calculate daily portfolio values
    const dailyData = calculateDailyReturns(
      trades,
      filledPrices,
      filledExchangeRates,
      filledSpyPrices,
      startDate,
      endDate
    )

    logger.info(`Portfolio history calculation completed. Generated ${dailyData.length} daily data points`)
    
    return dailyData

  } catch (error) {
    logger.error('Error calculating portfolio history:', error)
    throw error
  }
}

/**
 * Get cached portfolio history
 */
export async function getCachedPortfolioHistory(): Promise<DailyPortfolioData[]> {
  return cacheManager.getOrSet(
    CacheKey.PORTFOLIO_HISTORY,
    calculatePortfolioHistory,
    CACHE_TTL.PORTFOLIO_HISTORY
  )
}

/**
 * Get cached current portfolio data
 */
export async function getCachedPortfolioCurrentData(): Promise<PortfolioCurrentData> {
  return cacheManager.getOrSet(
    CacheKey.PORTFOLIO_CURRENT,
    async () => {
      const { holdings, exitedPositions } = await generatePortfolioData()
      
      // Calculate summary data
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const totalCost = holdings.reduce((sum, h) => sum + h.costBasisNZD, 0)
      const totalGain = totalValue - totalCost
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      
      return {
        holdings,
        exitedPositions,
        summary: {
          totalValueNZD: totalValue,
          totalCostBasisNZD: totalCost,
          totalGainNZD: totalGain,
          totalGainPercent
        },
        lastUpdated: new Date().toISOString()
      }
    },
    CACHE_TTL.PORTFOLIO_CURRENT
  )
}

/**
 * Get cached portfolio composition data
 */
export async function getCachedPortfolioComposition(): Promise<PortfolioComposition> {
  return cacheManager.getOrSet(
    CacheKey.PORTFOLIO_COMPOSITION,
    async () => {
      const { holdings } = await getCachedPortfolioCurrentData()
      
      // Calculate composition percentages
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const compositions = holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        value: h.currentValueNZD,
        percentage: totalValue > 0 ? (h.currentValueNZD / totalValue) * 100 : 0,
        color: h.color || '#000000'
      }))
      
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
 * Register cache refresh callbacks
 */
export function registerPortfolioCacheRefreshCallbacks(): void {
  // Register refresh callback for portfolio history
  cacheManager.registerRefreshCallback(
    CacheKey.PORTFOLIO_HISTORY,
    calculatePortfolioHistory
  )
  
  // Register refresh callback for current portfolio
  cacheManager.registerRefreshCallback(
    CacheKey.PORTFOLIO_CURRENT,
    async () => {
      const { holdings, exitedPositions } = await generatePortfolioData()
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const totalCost = holdings.reduce((sum, h) => sum + h.costBasisNZD, 0)
      const totalGain = totalValue - totalCost
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      
      return {
        holdings,
        exitedPositions,
        summary: {
          totalValueNZD: totalValue,
          totalCostBasisNZD: totalCost,
          totalGainNZD: totalGain,
          totalGainPercent
        },
        lastUpdated: new Date().toISOString()
      }
    }
  )
  
  // Register refresh callback for portfolio composition
  cacheManager.registerRefreshCallback(
    CacheKey.PORTFOLIO_COMPOSITION,
    async () => {
      const { holdings } = await getCachedPortfolioCurrentData()
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const compositions = holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        value: h.currentValueNZD,
        percentage: totalValue > 0 ? (h.currentValueNZD / totalValue) * 100 : 0,
        color: h.color || '#000000'
      }))
      
      compositions.sort((a, b) => b.percentage - a.percentage)
      
      return {
        compositions,
        lastUpdated: new Date().toISOString()
      }
    }
  )
  
  logger.info('Portfolio cache refresh callbacks registered')
}

/**
 * Invalidate portfolio caches (called after trade updates)
 */
export async function invalidatePortfolioCaches(): Promise<void> {
  await cacheManager.invalidateOnTradeUpdate()
}

/**
 * Warm up portfolio caches by pre-fetching data
 */
export async function warmUpPortfolioCaches(): Promise<void> {
  logger.info('Warming up portfolio caches...')
  
  try {
    // Pre-fetch all portfolio data in parallel
    const startTime = Date.now()
    
    await Promise.all([
      getCachedPortfolioHistory(),
      getCachedPortfolioCurrentData(),
      getCachedPortfolioComposition()
    ])
    
    const duration = Date.now() - startTime
    logger.info(`Portfolio caches warmed up in ${duration}ms`)
  } catch (error) {
    logger.error('Error warming up portfolio caches:', error)
  }
}

// Listen for cache events
cacheManager.on(CacheEvent.TRADE_UPDATED, () => {
  logger.info('Trade update event received, portfolio caches invalidated')
})

cacheManager.on(CacheEvent.CACHE_EXPIRED, (data) => {
  logger.info(`Cache expired event: ${data.key}`)
})

// Export the service
export default {
  getCachedPortfolioHistory,
  getCachedPortfolioCurrentData,
  getCachedPortfolioComposition,
  invalidatePortfolioCaches,
  warmUpPortfolioCaches,
  registerPortfolioCacheRefreshCallbacks
}