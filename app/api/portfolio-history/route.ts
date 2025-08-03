import { NextResponse } from 'next/server'
import { parseCSVData } from '@/lib/portfolio'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { CACHE_TTL, FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

interface StockPrice {
  date: Date
  close: number
}

// Enhanced in-memory cache with TTL and size limits
interface CacheEntry {
  data: DailyPortfolioData[]
  timestamp: number
  etag: string
}

const cache: Map<string, CacheEntry> = new Map()
const MAX_CACHE_SIZE = 10 // Maximum number of cache entries

// Generate ETag for cache validation
function generateETag(data: any): string {
  const hash = require('crypto').createHash('md5')
  hash.update(JSON.stringify(data))
  return hash.digest('hex')
}

// Clean up old cache entries
function cleanupCache() {
  if (cache.size <= MAX_CACHE_SIZE) return
  
  // Sort by timestamp and remove oldest entries
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)
  toRemove.forEach(([key]) => cache.delete(key))
}

// Get historical prices for a stock with retry logic
async function getHistoricalPrices(ticker: string, startDate: Date, endDate: Date, retries = 3): Promise<Map<string, number>> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Map ticker symbols for Yahoo Finance
      let yfinanceTicker = ticker
      if (ticker === 'MFT') {
        yfinanceTicker = 'MFT.NZ'
      }

      logger.debug(`Fetching history for ${yfinanceTicker} from ${startDate.toISOString()} to ${endDate.toISOString()} (attempt ${attempt + 1})`)
      
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
      logger.error(`Error fetching prices for ${ticker} (attempt ${attempt + 1}):`, error)
      if (attempt === retries - 1) {
        return new Map()
      }
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  return new Map()
}

// Get USD/NZD exchange rate with retry logic
async function getUSDNZDRate(startDate: Date, endDate: Date, retries = 3): Promise<Map<string, number>> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      logger.debug(`Fetching USD/NZD exchange rate from ${startDate.toISOString()} to ${endDate.toISOString()} (attempt ${attempt + 1})`)
      
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
      logger.error(`Error fetching USD/NZD rate (attempt ${attempt + 1}):`, error)
      if (attempt === retries - 1) {
        return new Map()
      }
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  return new Map()
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

// Optimized batch processing for portfolio calculations
function calculatePortfolioHistory(
  trades: any[],
  tickerPriceMap: Map<string, Map<string, number>>,
  filledExchangeRates: Map<string, number>,
  filledSPYPrices: Map<string, number>,
  startDate: Date,
  endDate: Date
): DailyPortfolioData[] {
  const portfolioHistory: DailyPortfolioData[] = []
  const dailyHoldings = new Map<string, Map<string, number>>()
  const currentHoldings = new Map<string, number>()
  
  // Initialize holdings for all tickers
  const tickers = [...new Set(trades.map(t => t.code))]
  tickers.forEach(ticker => currentHoldings.set(ticker, 0))

  // Pre-process trades by date for faster lookup
  const tradesByDate = new Map<string, any[]>()
  trades.forEach(trade => {
    const existing = tradesByDate.get(trade.date) || []
    existing.push(trade)
    tradesByDate.set(trade.date, existing)
  })

  // Helper function to get the nearest available SPY price
  const getNearestSPYPrice = (dateStr: string, filledPrices: Map<string, number>): number => {
    if (filledPrices.has(dateStr)) {
      return filledPrices.get(dateStr)!
    }
    
    const targetDate = new Date(dateStr)
    for (let i = 1; i <= 5; i++) {
      // Try future dates
      const futureDate = new Date(targetDate)
      futureDate.setDate(futureDate.getDate() + i)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      if (filledPrices.has(futureDateStr)) {
        return filledPrices.get(futureDateStr)!
      }
      
      // Try past dates
      const pastDate = new Date(targetDate)
      pastDate.setDate(pastDate.getDate() - i)
      const pastDateStr = pastDate.toISOString().split('T')[0]
      if (filledPrices.has(pastDateStr)) {
        return filledPrices.get(pastDateStr)!
      }
    }
    
    return 0
  }

  // Process each day
  let currentCostBasis = 0
  let soldCapitalAvailable = 0
  let sp500Shares = 0
  let sp500CostBasis = 0

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    // Process trades for this day
    const todaysTrades = tradesByDate.get(dateStr) || []
    todaysTrades.forEach(trade => {
      const currentShares = currentHoldings.get(trade.code) || 0
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        currentHoldings.set(trade.code, currentShares + trade.qty)
      } else if (trade.type === 'Sell') {
        currentHoldings.set(trade.code, currentShares + trade.qty) // qty is negative for sells
      }
    })

    // Save holdings for this day
    const holdingsSnapshot = new Map(currentHoldings)
    dailyHoldings.set(dateStr, holdingsSnapshot)

    // Calculate portfolio value for this day
    let portfolioValue = 0
    holdingsSnapshot.forEach((shares, ticker) => {
      if (shares > 0) {
        const priceMap = tickerPriceMap.get(ticker)
        const price = priceMap?.get(dateStr) || 0
        
        // Get currency for this ticker
        const tickerTrade = trades.find(t => t.code === ticker)
        const currency = tickerTrade?.instrumentCurrency || 'NZD'
        
        if (currency === 'USD') {
          const exchangeRate = filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
          portfolioValue += shares * price * exchangeRate
        } else {
          portfolioValue += shares * price
        }
      }
    })

    // Update cost basis based on trades and calculate S&P 500 equivalent
    todaysTrades.forEach(trade => {
      const exchangeRate = trade.instrumentCurrency === 'USD' 
        ? (filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE)
        : 1
      
      const tradeValueNZD = Math.abs(trade.qty * trade.price * exchangeRate)
      
      if (trade.type === 'Buy') {
        if (soldCapitalAvailable >= tradeValueNZD) {
          soldCapitalAvailable -= tradeValueNZD
        } else {
          const newCapital = tradeValueNZD - soldCapitalAvailable
          currentCostBasis += newCapital
          soldCapitalAvailable = 0
          
          // Calculate how many SPY shares we could buy with this new capital
          const spyPrice = getNearestSPYPrice(dateStr, filledSPYPrices)
          if (spyPrice > 0) {
            const spyPriceNZD = spyPrice * (filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE)
            const newSp500Shares = newCapital / spyPriceNZD
            sp500Shares += newSp500Shares
            sp500CostBasis += newCapital
          }
        }
      } else if (trade.type === 'Sell') {
        soldCapitalAvailable += tradeValueNZD
      }
    })

    // Calculate S&P 500 value
    const spyPrice = getNearestSPYPrice(dateStr, filledSPYPrices)
    const spyPriceNZD = spyPrice * (filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE)
    const sp500Value = sp500Shares * spyPriceNZD

    // For the first day with trades, ensure S&P 500 value equals cost basis if no price is available
    if (sp500CostBasis > 0 && sp500Value === 0 && todaysTrades.length > 0) {
      portfolioHistory.push({
        date: dateStr,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        costBasis: Math.round(currentCostBasis * 100) / 100,
        sp500Value: Math.round(sp500CostBasis * 100) / 100
      })
    } else {
      portfolioHistory.push({
        date: dateStr,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        costBasis: Math.round(currentCostBasis * 100) / 100,
        sp500Value: Math.round(sp500Value * 100) / 100
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return portfolioHistory
}

export async function GET(request: Request) {
  try {
    // Check if-none-match header for ETag validation
    const ifNoneMatch = request.headers.get('if-none-match')
    
    // Check cache first
    const cacheKey = 'portfolio-history'
    const cached = cache.get(cacheKey)
    
    // Validate ETag
    if (cached && ifNoneMatch && cached.etag === ifNoneMatch) {
      return new Response(null, { 
        status: 304,
        headers: {
          'ETag': cached.etag,
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        }
      })
    }
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PORTFOLIO_HISTORY) {
      logger.debug('Returning cached portfolio history')
      return NextResponse.json({
        history: cached.data,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        cached: true
      }, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      })
    }

    logger.debug('Cache miss, calculating portfolio history...')

    // Check if blob URL is configured
    if (!process.env.TRADE_DATA_BLOB_URL) {
      logger.error('TRADE_DATA_BLOB_URL environment variable is not configured')
      return NextResponse.json(
        { error: 'Portfolio data source not configured' },
        { status: 500 }
      )
    }

    // Download CSV from Vercel Blob storage using SDK
    const csvContent = await downloadTradeDataFromBlob()
    const trades = parseCSVData(csvContent)

    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info('Portfolio history calculation started')
    logger.debug('Date range:', { start: startDate.toISOString(), end: endDate.toISOString() })
    logger.debug('Number of trades:', trades.length)

    // Get unique tickers
    const tickers = [...new Set(trades.map(t => t.code))]

    // Fetch all historical prices and exchange rates in parallel with better error handling
    logger.info('Fetching historical prices for tickers:', tickers)
    
    try {
      // Create all promises at once for parallel execution
      const allPromises = [
        getUSDNZDRate(startDate, endDate),
        getHistoricalPrices('SPY', startDate, endDate), // Add S&P 500 ETF
        ...tickers.map(ticker => getHistoricalPrices(ticker, startDate, endDate))
      ]
      
      // Execute all fetches in parallel with timeout
      const startTime = Date.now()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching price data')), 30000)
      )
      
      const results = await Promise.race([
        Promise.all(allPromises),
        timeoutPromise
      ]) as [Map<string, number>, Map<string, number>, ...Map<string, number>[]]
      
      const [exchangeRateMap, spyPriceMap, ...stockPriceMaps] = results
      const fetchTime = Date.now() - startTime
      
      logger.info(`Successfully fetched all price data in ${fetchTime}ms`)

      // Create ticker to price map
      const tickerPriceMap = new Map<string, Map<string, number>>()
      tickers.forEach((ticker, index) => {
        tickerPriceMap.set(ticker, fillMissingDates(stockPriceMaps[index], startDate, endDate))
      })

      // Fill exchange rate gaps and SPY prices
      const filledExchangeRates = fillMissingDates(exchangeRateMap, startDate, endDate)
      const filledSPYPrices = fillMissingDates(spyPriceMap, startDate, endDate)

      // Calculate portfolio history using optimized function
      const portfolioHistory = calculatePortfolioHistory(
        trades,
        tickerPriceMap,
        filledExchangeRates,
        filledSPYPrices,
        startDate,
        endDate
      )

      // Generate ETag
      const etag = generateETag(portfolioHistory)

      // Cache the result
      cleanupCache()
      cache.set(cacheKey, {
        data: portfolioHistory,
        timestamp: Date.now(),
        etag
      })

      return NextResponse.json({
        history: portfolioHistory,
        lastUpdated: new Date().toISOString(),
        cached: false
      }, {
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'MISS'
        }
      })
    } catch (error) {
      logger.error('Error during price fetching:', error)
      
      // Return stale cache if available
      if (cached) {
        logger.info('Returning stale cache due to error')
        return NextResponse.json({
          history: cached.data,
          lastUpdated: new Date(cached.timestamp).toISOString(),
          cached: true,
          stale: true
        }, {
          headers: {
            'ETag': cached.etag,
            'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
            'X-Cache': 'STALE'
          }
        })
      }
      
      throw error
    }
  } catch (error) {
    logger.error('Error calculating portfolio history:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio history' },
      { status: 500 }
    )
  }
}