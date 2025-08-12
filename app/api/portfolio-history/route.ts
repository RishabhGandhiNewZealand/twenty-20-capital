import { NextResponse } from 'next/server'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { CACHE_TTL, FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'
import { getCachedTradeData } from '@/lib/trade-data-cache'

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

// Simple in-memory cache with TTL
interface CacheEntry {
  data: DailyPortfolioData[]
  timestamp: number
}

const cache: Map<string, CacheEntry> = new Map()

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

export async function GET() {
  try {
    // Check cache first
    const cacheKey = 'portfolio-history'
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PORTFOLIO_HISTORY) {
      logger.debug('Returning cached portfolio history')
      return NextResponse.json({
        history: cached.data,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        cached: true
      })
    }

    logger.debug('Cache miss, calculating portfolio history...')

    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    // If no trades found, return empty response
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return NextResponse.json({
        history: [],
        lastUpdated: new Date().toISOString(),
        cached: false
      })
    }

    // Sort trades by date, and within the same date: Sells first, then Buys, then Reinvestments
    trades.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateCompare !== 0) return dateCompare
      
      // Same date - sort by type: Sell -> Buy -> Reinvestment
      const typeOrder = { 'Sell': 0, 'Buy': 1, 'Reinvestment': 2 }
      return typeOrder[a.type] - typeOrder[b.type]
    })

    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info('Portfolio history calculation started')
    logger.debug('Date range:', { start: startDate.toISOString(), end: endDate.toISOString() })
    logger.debug('Number of trades:', trades.length)

    // Get unique tickers
    const tickers = [...new Set(trades.map(t => t.code))]

    // Fetch all historical prices and exchange rates in parallel
    logger.info('Fetching historical prices for tickers:', tickers)
    
    try {
      // Create all promises at once for parallel execution
      const allPromises = [
        getUSDNZDRate(startDate, endDate),
        getHistoricalPrices('SPY', startDate, endDate), // Add S&P 500 ETF
        ...tickers.map(ticker => getHistoricalPrices(ticker, startDate, endDate))
      ]
      
      // Execute all fetches in parallel
      const startTime = Date.now()
      const [exchangeRateMap, spyPriceMap, ...stockPriceMaps] = await Promise.all(allPromises)
      const fetchTime = Date.now() - startTime
      
      logger.info(`Successfully fetched all price data in ${fetchTime}ms`)
      logger.debug('Price data stats:', {
        exchangeRateEntries: exchangeRateMap.size,
        spyPriceEntries: spyPriceMap.size,
        stockPriceEntries: stockPriceMaps.map((map, index) => ({
          ticker: tickers[index],
          entries: map.size
        }))
      })

      // Create ticker to price map
      const tickerPriceMap = new Map<string, Map<string, number>>()
      tickers.forEach((ticker, index) => {
        tickerPriceMap.set(ticker, fillMissingDates(stockPriceMaps[index], startDate, endDate))
      })

      // Fill exchange rate gaps and SPY prices
      const filledExchangeRates = fillMissingDates(exchangeRateMap, startDate, endDate)
      const filledSPYPrices = fillMissingDates(spyPriceMap, startDate, endDate)

      // Helper function to get the nearest available SPY price
      const getNearestSPYPrice = (dateStr: string, filledPrices: Map<string, number>): number => {
        // First try the exact date
        if (filledPrices.has(dateStr)) {
          return filledPrices.get(dateStr)!
        }
        
        // Look for the nearest price within 5 days
        const targetDate = new Date(dateStr)
        for (let i = 1; i <= 5; i++) {
          // Try future dates
          const futureDate = new Date(targetDate)
          futureDate.setDate(futureDate.getDate() + i)
          const futureDateStr = futureDate.toISOString().split('T')[0]
          if (filledPrices.has(futureDateStr)) {
            logger.debug(`Using SPY price from ${futureDateStr} for ${dateStr}`)
            return filledPrices.get(futureDateStr)!
          }
          
          // Try past dates
          const pastDate = new Date(targetDate)
          pastDate.setDate(pastDate.getDate() - i)
          const pastDateStr = pastDate.toISOString().split('T')[0]
          if (filledPrices.has(pastDateStr)) {
            logger.debug(`Using SPY price from ${pastDateStr} for ${dateStr}`)
            return filledPrices.get(pastDateStr)!
          }
        }
        
        return 0
      }

      // Calculate daily holdings
      const dailyHoldings = new Map<string, Map<string, number>>() // date -> ticker -> shares
      const currentHoldings = new Map<string, number>() // ticker -> shares

      // Initialize holdings for all tickers
      tickers.forEach(ticker => currentHoldings.set(ticker, 0))

      // Process each day
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Process trades for this day
        const todaysTrades = trades.filter(t => t.date === dateStr)
        todaysTrades.forEach(trade => {
          const currentShares = currentHoldings.get(trade.code) || 0
          if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
            currentHoldings.set(trade.code, currentShares + trade.qty)
          } else if (trade.type === 'Sell') {
            // qty is positive in database, so we need to subtract for sells
            currentHoldings.set(trade.code, Math.max(0, currentShares - Math.abs(trade.qty)))
          }
        })

        // Save holdings for this day
        const holdingsSnapshot = new Map(currentHoldings)
        dailyHoldings.set(dateStr, holdingsSnapshot)

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Calculate daily portfolio values, cost basis, and S&P 500 equivalent
      const portfolioHistory: DailyPortfolioData[] = []
      
      // First pass: Calculate the cumulative cost basis and S&P 500 purchases for each day
      // We need to process all trades to properly track capital flow
      let runningCostBasis = 0
      let runningSoldCapital = 0
      let runningSp500Shares = 0
      let runningSp500CostBasis = 0
      
      // Maps to store the state at each date
      const costBasisByDate = new Map<string, number>()
      const sp500SharesByDate = new Map<string, number>()
      const sp500CostBasisByDate = new Map<string, number>()
      
      // Process all trades in chronological order to build up the capital flow
      logger.debug('Processing trades to calculate capital flow (Sells before Buys on same day)...')
      trades.forEach(trade => {
        const dateStr = trade.date
        
        // For trade execution, use the actual exchange rate from the trade record
        // This represents the fixed NZD amount at the time of the trade
        const tradeValueNZD = Math.abs(trade.value) // Use the actual NZD value from the trade
        
        // Alternative calculation if value field is not reliable:
        // const tradeExchangeRate = trade.instrumentCurrency === 'USD' ? trade.exchRate : 1
        // const tradeValueNZD = Math.abs(trade.qty * trade.price * tradeExchangeRate)
        
        if (trade.type === 'Buy') {
          // Check if this buy is using sold capital or new capital
          if (runningSoldCapital >= tradeValueNZD) {
            // This buy is fully covered by previous sells - not new capital
            runningSoldCapital -= tradeValueNZD
            logger.debug(`Trade ${dateStr}: Buy ${trade.code} using sold capital`, {
              tradeValue: tradeValueNZD.toFixed(2),
              remainingSoldCapital: runningSoldCapital.toFixed(2),
              costBasis: runningCostBasis.toFixed(2),
              exchRate: trade.exchRate
            })
          } else {
            // This buy requires new capital (partially or fully)
            const newCapital = tradeValueNZD - runningSoldCapital
            runningCostBasis += newCapital
            runningSoldCapital = 0
            
            // Only buy S&P 500 shares with truly new capital
            const spyPrice = getNearestSPYPrice(dateStr, filledSPYPrices)
            if (spyPrice > 0) {
              // For S&P 500, use the market exchange rate on the trade date
              // since we're simulating a purchase at that time
              const spyExchangeRate = filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
              const spyPriceNZD = spyPrice * spyExchangeRate
              const newSp500Shares = newCapital / spyPriceNZD
              runningSp500Shares += newSp500Shares
              runningSp500CostBasis += newCapital
              logger.debug(`Trade ${dateStr}: Buy ${trade.code} with NEW capital ${newCapital.toFixed(2)} NZD`, {
                newCapital: newCapital.toFixed(2),
                totalCostBasis: runningCostBasis.toFixed(2),
                newSp500Shares: newSp500Shares.toFixed(4),
                totalSp500Shares: runningSp500Shares.toFixed(4),
                tradeExchRate: trade.exchRate,
                spyExchRate: spyExchangeRate
              })
            } else {
              logger.warn(`No SPY price available for ${dateStr}, skipping S&P 500 purchase`)
            }
          }
        } else if (trade.type === 'Sell') {
          // Add sold capital to available pool for re-investment
          runningSoldCapital += tradeValueNZD
          logger.debug(`Trade ${dateStr}: Sell ${trade.code}`, {
            sellValue: tradeValueNZD.toFixed(2),
            totalSoldCapital: runningSoldCapital.toFixed(2),
            costBasis: runningCostBasis.toFixed(2),
            exchRate: trade.exchRate
          })
        } else if (trade.type === 'Reinvestment') {
          // Reinvestment doesn't affect cost basis or S&P 500 purchases
          // It's just dividends being automatically reinvested
          logger.debug(`Trade ${dateStr}: Reinvestment ${trade.code} - no cost basis change`, {
            reinvestmentValue: tradeValueNZD.toFixed(2),
            costBasis: runningCostBasis.toFixed(2),
            exchRate: trade.exchRate
          })
        }
        
        // Store the state after this trade
        costBasisByDate.set(dateStr, runningCostBasis)
        sp500SharesByDate.set(dateStr, runningSp500Shares)
        sp500CostBasisByDate.set(dateStr, runningSp500CostBasis)
      })
      
      logger.info('Capital flow calculation complete', {
        finalCostBasis: runningCostBasis.toFixed(2),
        finalSoldCapital: runningSoldCapital.toFixed(2),
        finalSp500Shares: runningSp500Shares.toFixed(4)
      })
      
      // Second pass: Generate daily portfolio values using the calculated states
      const processDate = new Date(startDate)
      let lastCostBasis = 0
      let lastSp500Shares = 0
      let lastSp500CostBasis = 0
      
      while (processDate <= endDate) {
        const dateStr = processDate.toISOString().split('T')[0]
        const holdings = dailyHoldings.get(dateStr)!
        
        // Update cost basis and S&P 500 shares if there were trades on this date
        if (costBasisByDate.has(dateStr)) {
          lastCostBasis = costBasisByDate.get(dateStr)!
          lastSp500Shares = sp500SharesByDate.get(dateStr)!
          lastSp500CostBasis = sp500CostBasisByDate.get(dateStr)!
        }
        
        // Calculate portfolio value for this day
        let portfolioValue = 0
        holdings.forEach((shares, ticker) => {
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
        
        // Calculate S&P 500 value
        const spyPrice = getNearestSPYPrice(dateStr, filledSPYPrices)
        const spyPriceNZD = spyPrice * (filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE)
        const sp500Value = lastSp500Shares * spyPriceNZD
        
        // For the first day with trades, ensure S&P 500 value equals cost basis if no price is available
        const todaysTrades = trades.filter(t => t.date === dateStr)
        if (lastSp500CostBasis > 0 && sp500Value === 0 && todaysTrades.length > 0) {
          logger.warn(`No S&P 500 price available for ${dateStr}, using cost basis`)
          portfolioHistory.push({
            date: dateStr,
            portfolioValue: Math.round(portfolioValue * 100) / 100,
            costBasis: Math.round(lastCostBasis * 100) / 100,
            sp500Value: Math.round(lastSp500CostBasis * 100) / 100
          })
        } else {
          portfolioHistory.push({
            date: dateStr,
            portfolioValue: Math.round(portfolioValue * 100) / 100,
            costBasis: Math.round(lastCostBasis * 100) / 100,
            sp500Value: Math.round(sp500Value * 100) / 100
          })
        }
        
        processDate.setDate(processDate.getDate() + 1)
      }

      // Cache the result
      cache.set(cacheKey, {
        data: portfolioHistory,
        timestamp: Date.now()
      })

      return NextResponse.json({
        history: portfolioHistory,
        lastUpdated: new Date().toISOString(),
        cached: false
      })
    } catch (error) {
      logger.error('Error during price fetching:', error)
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