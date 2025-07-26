import { NextResponse } from 'next/server'
import { parseCSVData } from '@/lib/portfolio'
import fs from 'fs'
import path from 'path'
import yahooFinance from 'yahoo-finance2'

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
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Get historical prices for a stock
async function getHistoricalPrices(ticker: string, startDate: Date, endDate: Date): Promise<Map<string, number>> {
  try {
    // Map ticker symbols for Yahoo Finance
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    }

    console.log(`Fetching history for ${yfinanceTicker} from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // Fetch all historical data at once
    const quotes = await yahooFinance.historical(yfinanceTicker, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    })

    console.log(`Got ${quotes.length} quotes for ${yfinanceTicker}`)

    const priceMap = new Map<string, number>()
    quotes.forEach(quote => {
      const dateStr = quote.date.toISOString().split('T')[0]
      priceMap.set(dateStr, quote.close)
    })

    return priceMap
  } catch (error) {
    console.error(`Error fetching prices for ${ticker}:`, error)
    return new Map()
  }
}

// Get USD/NZD exchange rate
async function getUSDNZDRate(startDate: Date, endDate: Date): Promise<Map<string, number>> {
  try {
    console.log(`Fetching USD/NZD exchange rate from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    const quotes = await yahooFinance.historical('NZDUSD=X', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    })

    console.log(`Got ${quotes.length} exchange rate quotes`)

    const rateMap = new Map<string, number>()
    quotes.forEach(quote => {
      const dateStr = quote.date.toISOString().split('T')[0]
      // Convert NZD/USD to USD/NZD by inverting
      rateMap.set(dateStr, 1 / quote.close)
    })

    return rateMap
  } catch (error) {
    console.error('Error fetching USD/NZD rate:', error)
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
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached portfolio history')
      return NextResponse.json({
        history: cached.data,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        cached: true
      })
    }

    console.log('Cache miss, calculating portfolio history...')

    // Read and parse CSV
    const csvPath = path.join(process.cwd(), 'RishTrades22July25.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const trades = parseCSVData(csvContent)

    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    console.log('Portfolio history calculation started')
    console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString())
    console.log('Number of trades:', trades.length)

    // Get unique tickers
    const tickers = [...new Set(trades.map(t => t.code))]

    // Fetch all historical prices and exchange rates in parallel
    console.log('Fetching historical prices for tickers:', tickers)
    console.log('This may take a moment as we fetch all historical data...')
    
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
      
      console.log(`Successfully fetched all price data in ${fetchTime}ms`)
      console.log('Exchange rate entries:', exchangeRateMap.size)
      console.log('SPY price entries:', spyPriceMap.size)
      stockPriceMaps.forEach((map, index) => {
        console.log(`${tickers[index]} price entries:`, map.size)
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
            console.log(`Using SPY price from ${futureDateStr} for ${dateStr}`)
            return filledPrices.get(futureDateStr)!
          }
          
          // Try past dates
          const pastDate = new Date(targetDate)
          pastDate.setDate(pastDate.getDate() - i)
          const pastDateStr = pastDate.toISOString().split('T')[0]
          if (filledPrices.has(pastDateStr)) {
            console.log(`Using SPY price from ${pastDateStr} for ${dateStr}`)
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
            currentHoldings.set(trade.code, currentShares + trade.qty) // qty is negative for sells
          }
        })

        // Save holdings for this day
        const holdingsSnapshot = new Map(currentHoldings)
        dailyHoldings.set(dateStr, holdingsSnapshot)

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Calculate daily portfolio values, cost basis, and S&P 500 equivalent
      const portfolioHistory: DailyPortfolioData[] = []
      let currentCostBasis = 0
      let soldCapitalAvailable = 0
      let sp500Shares = 0
      let sp500CostBasis = 0 // Track the actual amount invested in S&P 500

      const processDate = new Date(startDate)
      while (processDate <= endDate) {
        const dateStr = processDate.toISOString().split('T')[0]
        const holdings = dailyHoldings.get(dateStr)!
        
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
              const exchangeRate = filledExchangeRates.get(dateStr) || 1.65
              portfolioValue += shares * price * exchangeRate
            } else {
              portfolioValue += shares * price
            }
          }
        })

        // Update cost basis based on trades and calculate S&P 500 equivalent
        const todaysTrades = trades.filter(t => t.date === dateStr)
        todaysTrades.forEach(trade => {
          const exchangeRate = trade.instrumentCurrency === 'USD' 
            ? (filledExchangeRates.get(dateStr) || 1.65)
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
                const spyPriceNZD = spyPrice * (filledExchangeRates.get(dateStr) || 1.65)
                const newSp500Shares = newCapital / spyPriceNZD
                sp500Shares += newSp500Shares
                sp500CostBasis += newCapital
                console.log(`Date ${dateStr}: Investing ${newCapital.toFixed(2)} NZD in S&P 500, buying ${newSp500Shares.toFixed(4)} shares at ${spyPriceNZD.toFixed(2)} NZD per share`)
              }
            }
          } else if (trade.type === 'Sell') {
            soldCapitalAvailable += tradeValueNZD
          }
          // Reinvestment doesn't affect cost basis
        })

        // Calculate S&P 500 value
        const spyPrice = getNearestSPYPrice(dateStr, filledSPYPrices)
        const spyPriceNZD = spyPrice * (filledExchangeRates.get(dateStr) || 1.65)
        const sp500Value = sp500Shares * spyPriceNZD

        // For the first day with trades, ensure S&P 500 value equals cost basis if no price is available
        if (sp500CostBasis > 0 && sp500Value === 0 && todaysTrades.length > 0) {
          console.log(`Warning: No S&P 500 price available for ${dateStr}, using cost basis`)
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
      console.error('Error during price fetching:', error)
      throw error
    }
  } catch (error) {
    console.error('Error calculating portfolio history:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio history' },
      { status: 500 }
    )
  }
}