import { unstable_cache } from 'next/cache'
import { getCachedTradeData } from './trade-data-cache'
import { calculateDailyReturns } from './portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'
import { FALLBACK_USD_TO_NZD_RATE } from './constants'

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 1200 // 20 minutes for Yahoo Finance data
const CACHE_TAG = 'portfolio-history'

// Get historical prices for a stock
async function getHistoricalPrices(ticker: string, startDate: Date, endDate: Date): Promise<Map<string, number>> {
  try {
    // Map ticker symbols for Yahoo Finance
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    }

    logger.debug(`Fetching history for ${yfinanceTicker} from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // Fetch all historical data at once
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
}

// Get USD/NZD exchange rate
async function getUSDNZDRate(startDate: Date, endDate: Date): Promise<Map<string, number>> {
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
    return new Map()
  }
}

// Fill forward missing dates in price data
function fillMissingDates(priceMap: Map<string, number>, startDate: Date, endDate: Date): Map<string, number> {
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
 * Calculate portfolio history
 * This is the raw calculation function that will be cached
 */
async function calculatePortfolioHistory(): Promise<DailyPortfolioData[]> {
  try {
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    // If no trades found, return empty response
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
 * Cached version of calculatePortfolioHistory
 * This function will cache the results for the specified duration
 */
export const getCachedPortfolioHistory = unstable_cache(
  calculatePortfolioHistory,
  ['portfolio-history'],
  {
    revalidate: false, // Don't auto-revalidate, we'll manually invalidate
    tags: ['portfolio-history', 'portfolio-all']
  }
)