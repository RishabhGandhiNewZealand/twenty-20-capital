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
import { TradeRecord } from '@/types/portfolio'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache-config'

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
 * Get the nearest available price from a price map (for trade dates)
 */
function getNearestPrice(
  dateStr: string, 
  priceMap: Map<string, number>,
  lookbackDays: number = 5
): number {
  // First try the exact date
  if (priceMap.has(dateStr)) {
    return priceMap.get(dateStr)!
  }
  
  // Look for the nearest price within lookback days
  const targetDate = new Date(dateStr)
  for (let i = 1; i <= lookbackDays; i++) {
    // Try past dates first (more conservative for purchases)
    const pastDate = new Date(targetDate)
    pastDate.setDate(pastDate.getDate() - i)
    const pastDateStr = pastDate.toISOString().split('T')[0]
    if (priceMap.has(pastDateStr)) {
      return priceMap.get(pastDateStr)!
    }
    
    // Try future dates
    const futureDate = new Date(targetDate)
    futureDate.setDate(futureDate.getDate() + i)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    if (priceMap.has(futureDateStr)) {
      return priceMap.get(futureDateStr)!
    }
  }
  
  return 0
}

/**
 * Calculate S&P 500 benchmark shares using historical SPY prices
 */
async function calculateSP500Benchmark(
  trades: TradeRecord[],
  exchangeRate: number
): Promise<{ sp500Shares: number; currentCostBasis: number }> {
  if (!trades || trades.length === 0) {
    return { sp500Shares: 0, currentCostBasis: 0 }
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Get date range for SPY prices
  const startDate = new Date(sortedTrades[0].date)
  const endDate = new Date(sortedTrades[sortedTrades.length - 1].date)
  
  // Fetch historical SPY prices
  const spyPrices = await getHistoricalPrices('SPY', startDate, endDate)
  
  let sp500Shares = 0
  let currentCostBasis = 0
  let soldCapitalAvailable = 0
  
  for (const trade of sortedTrades) {
    const tradeValueNZD = Math.abs(trade.value)
    
    if (trade.type === 'Buy') {
      if (soldCapitalAvailable >= tradeValueNZD) {
        soldCapitalAvailable -= tradeValueNZD
      } else {
        const newCapital = tradeValueNZD - soldCapitalAvailable
        currentCostBasis += newCapital
        soldCapitalAvailable = 0
        
        // Use actual historical SPY price for this trade date
        const spyPriceUSD = getNearestPrice(trade.date, spyPrices)
        if (spyPriceUSD > 0) {
          const spyPriceNZD = spyPriceUSD * exchangeRate
          sp500Shares += newCapital / spyPriceNZD
        } else {
          logger.warn(`No SPY price found for trade date ${trade.date}, skipping S&P 500 calculation for this trade`)
        }
      }
    } else if (trade.type === 'Sell') {
      soldCapitalAvailable += tradeValueNZD
    }
  }
  
  return { sp500Shares, currentCostBasis }
}

/**
 * Calculate portfolio history with caching
 */
async function calculatePortfolioHistory(): Promise<DailyPortfolioData[]> {
  try {
    // Fetch cached trade data - ADMIN ONLY
    const adminUserId = process.env.ADMIN_USER_ID || ''
    const trades = await getCachedTradeData(adminUserId)
    
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
 * Get current price for a ticker
 */
async function getCurrentPrice(ticker: string): Promise<number> {
  try {
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    }

    const quote = await yahooFinance.quote(yfinanceTicker)
    return quote.regularMarketPrice || 0
  } catch (error) {
    logger.error(`Error fetching current price for ${ticker}:`, error)
    return 0
  }
}

/**
 * Get current USD/NZD exchange rate
 */
async function getCurrentUSDNZDRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('NZDUSD=X')
    return 1 / (quote.regularMarketPrice || 0.606)
  } catch (error) {
    logger.error('Error fetching USD/NZD rate:', error)
    return FALLBACK_USD_TO_NZD_RATE
  }
}

/**
 * Get cached current portfolio data
 */
export async function getCachedPortfolioCurrentData(): Promise<PortfolioCurrentData> {
  return cacheManager.getOrSet(
    CacheKey.PORTFOLIO_CURRENT,
    async () => {
      const { holdings, exitedPositions } = await generatePortfolioData()
      
      // Fetch current prices for all holdings
      const exchangeRate = await getCurrentUSDNZDRate()
      const tickers = holdings.map(h => h.symbol)
      
      const pricePromises = tickers.map(ticker => getCurrentPrice(ticker))
      const prices = await Promise.all(pricePromises)
      
      const priceMap = new Map<string, number>()
      tickers.forEach((ticker, index) => {
        priceMap.set(ticker, prices[index])
      })
      
      // Calculate current values and gains for each holding
      const enrichedHoldings = holdings.map(holding => {
        const currentPrice = priceMap.get(holding.symbol) || 0
        const isUSD = holding.instrumentCurrency === 'USD'
        const currentValueNZD = holding.totalShares * currentPrice * (isUSD ? exchangeRate : 1)
        const costBasisNZD = holding.totalShares * holding.avgPriceNZD
        const gainNZD = currentValueNZD - costBasisNZD
        const gainPercent = costBasisNZD > 0 ? ((gainNZD / costBasisNZD) * 100) : 0
        
        return {
          symbol: holding.symbol,
          name: holding.name,
          shares: holding.totalShares,
          currentPrice,
          currentValueNZD,
          costBasisNZD,
          gainNZD,
          gainPercent: isNaN(gainPercent) ? 0 : gainPercent,
          allocation: 0, // Will be calculated below
          currency: holding.instrumentCurrency
        }
      })
      
      // Calculate total value and allocations
      const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.costBasisNZD, 0)
      
      enrichedHoldings.forEach(holding => {
        holding.allocation = totalValue > 0 ? ((holding.currentValueNZD / totalValue) * 100) : 0
      })
      
      // Sort by allocation
      enrichedHoldings.sort((a, b) => b.allocation - a.allocation)
      
      const totalGain = totalValue - totalCost
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      
      // Calculate S&P 500 benchmark using actual historical SPY prices
      const adminUserId = process.env.ADMIN_USER_ID || ''
      const trades = await getCachedTradeData(adminUserId)
      
      const { sp500Shares, currentCostBasis } = await calculateSP500Benchmark(trades, exchangeRate)
      
      const currentSpyPrice = await getCurrentPrice('SPY')
      const sp500ValueUSD = sp500Shares * currentSpyPrice
      const sp500Value = sp500ValueUSD * exchangeRate
      const sp500GainNZD = sp500Value - currentCostBasis
      const sp500GainPercent = currentCostBasis > 0 ? ((sp500GainNZD / currentCostBasis) * 100) : 0
      
      return {
        holdings: enrichedHoldings,
        exitedPositions,
        summary: {
          totalValueNZD: totalValue,
          totalCostBasisNZD: totalCost,
          totalGainNZD: totalGain,
          totalGainPercent,
          sp500Value,
          sp500GainNZD,
          sp500GainPercent,
          exchangeRate
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
  
  // Register refresh callback for current portfolio (use the same logic as the cache getter)
  cacheManager.registerRefreshCallback(
    CacheKey.PORTFOLIO_CURRENT,
    async () => {
      // Call getCachedPortfolioCurrentData without the cache layer
      const { holdings, exitedPositions } = await generatePortfolioData()
      
      // Fetch current prices for all holdings
      const exchangeRate = await getCurrentUSDNZDRate()
      const tickers = holdings.map(h => h.symbol)
      
      const pricePromises = tickers.map(ticker => getCurrentPrice(ticker))
      const prices = await Promise.all(pricePromises)
      
      const priceMap = new Map<string, number>()
      tickers.forEach((ticker, index) => {
        priceMap.set(ticker, prices[index])
      })
      
      // Calculate current values and gains for each holding
      const enrichedHoldings = holdings.map(holding => {
        const currentPrice = priceMap.get(holding.symbol) || 0
        const isUSD = holding.instrumentCurrency === 'USD'
        const currentValueNZD = holding.totalShares * currentPrice * (isUSD ? exchangeRate : 1)
        const costBasisNZD = holding.totalShares * holding.avgPriceNZD
        const gainNZD = currentValueNZD - costBasisNZD
        const gainPercent = costBasisNZD > 0 ? ((gainNZD / costBasisNZD) * 100) : 0
        
        return {
          symbol: holding.symbol,
          name: holding.name,
          shares: holding.totalShares,
          currentPrice,
          currentValueNZD,
          costBasisNZD,
          gainNZD,
          gainPercent: isNaN(gainPercent) ? 0 : gainPercent,
          allocation: 0,
          currency: holding.instrumentCurrency
        }
      })
      
      const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.costBasisNZD, 0)
      
      enrichedHoldings.forEach(holding => {
        holding.allocation = totalValue > 0 ? ((holding.currentValueNZD / totalValue) * 100) : 0
      })
      
      enrichedHoldings.sort((a, b) => b.allocation - a.allocation)
      
      const totalGain = totalValue - totalCost
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      
      const adminUserId = process.env.ADMIN_USER_ID || ''
      const trades = await getCachedTradeData(adminUserId)
      
      const { sp500Shares, currentCostBasis } = await calculateSP500Benchmark(trades, exchangeRate)
      
      const currentSpyPrice = await getCurrentPrice('SPY')
      const sp500ValueUSD = sp500Shares * currentSpyPrice
      const sp500Value = sp500ValueUSD * exchangeRate
      const sp500GainNZD = sp500Value - currentCostBasis
      const sp500GainPercent = currentCostBasis > 0 ? ((sp500GainNZD / currentCostBasis) * 100) : 0
      
      return {
        holdings: enrichedHoldings,
        exitedPositions,
        summary: {
          totalValueNZD: totalValue,
          totalCostBasisNZD: totalCost,
          totalGainNZD: totalGain,
          totalGainPercent,
          sp500Value,
          sp500GainNZD,
          sp500GainPercent,
          exchangeRate
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
  
  // Invalidate Next.js cache tags
  try {
    revalidateTag(CACHE_TAGS.PORTFOLIO_COMPOSITIONS)
    revalidateTag(CACHE_TAGS.TRADE_DATA)
    revalidateTag(CACHE_TAGS.PORTFOLIO_HISTORY)
    logger.info('Next.js cache tags invalidated')
  } catch (error) {
    logger.error('Error invalidating Next.js cache tags:', error)
  }
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