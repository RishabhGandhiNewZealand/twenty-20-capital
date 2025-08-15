import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserDb } from '@/lib/rls-auth'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { FALLBACK_USD_TO_NZD_RATE, FALLBACK_NZD_TO_USD_RATE } from '@/lib/constants'

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

/**
 * Get historical prices for a stock with caching
 */
async function getHistoricalPrices(
  ticker: string, 
  startDate: Date, 
  endDate: Date
): Promise<Map<string, number>> {
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
}

/**
 * Get USD/NZD exchange rate
 */
async function getUSDNZDRate(startDate: Date, endDate: Date): Promise<Map<string, number>> {
  try {
    logger.debug(`Fetching USD/NZD rate from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    const quotes = await yahooFinance.historical('NZDUSD=X', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    })

    logger.debug(`Got ${quotes.length} exchange rate quotes`)

    const rateMap = new Map<string, number>()
    quotes.forEach(quote => {
      const dateStr = quote.date.toISOString().split('T')[0]
      // Convert NZD/USD to USD/NZD
      rateMap.set(dateStr, 1 / quote.close)
    })

    return rateMap
  } catch (error) {
    logger.error('Error fetching USD/NZD rate:', error)
    // Return empty map, will use fallback rate
    return new Map()
  }
}

/**
 * Fill missing dates in price map
 */
function fillMissingDates(
  priceMap: Map<string, number>,
  startDate: Date,
  endDate: Date
): Map<string, number> {
  const filledMap = new Map<string, number>()
  let lastPrice: number | null = null
  
  const currentDate = new Date(startDate)
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
 * GET /api/user-portfolio-history
 * 
 * Returns portfolio history data for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const userEmailHeader = request.headers.get('x-user-email')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    logger.info('Fetching user portfolio history', { 
      userId: userIdHeader, 
      email: userEmailHeader,
      isAdmin: isAdminHeader 
    })
    
    const startTime = Date.now()
    
    // Get user-specific database connection
    const sql = getUserDb(userIdHeader)
    
    // Fetch user's trades - using same structure as getCachedTradeData
    const trades = await sql`
      SELECT 
        id,
        code,
        market_code,
        name,
        date,
        type,
        qty,
        price,
        instrument_currency as instrumentCurrency,
        brokerage,
        brokerage_currency,
        exch_rate,
        value
      FROM application.trade_data
      WHERE user_id = ${userIdHeader}
        AND deleted_flag = false
      ORDER BY date ASC
    `
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found for user portfolio history')
      return NextResponse.json({
        history: [],
        lastUpdated: new Date().toISOString(),
        cacheInfo: {
          fetchTime: Date.now() - startTime,
          dataPoints: 0
        }
      })
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
    
    const duration = Date.now() - startTime
    
    // Return the data in same format as portfolio-history API
    return NextResponse.json({
      history: dailyData,
      lastUpdated: new Date().toISOString(),
      cacheInfo: {
        fetchTime: duration,
        dataPoints: dailyData.length
      }
    })
    
  } catch (error) {
    logger.error('Error fetching user portfolio history:', error)
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}