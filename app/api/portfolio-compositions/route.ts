import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

interface HoldingAtDate {
  symbol: string
  name: string
  shares: number
  value: number
  percentage: number
  currency: string
}

interface CompositionData {
  [date: string]: HoldingAtDate[]
}

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 1200 // 20 minutes for Yahoo Finance data
const CACHE_TAG = 'portfolio-compositions'

/**
 * Calculate portfolio compositions for historical dates with actual prices
 * This is the raw calculation function that will be cached
 */
async function calculatePortfolioCompositions(): Promise<CompositionData> {
  try {
    logger.info('Starting portfolio composition calculation...')
    
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found for portfolio compositions')
      return {}
    }
    
    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info(`Processing dates from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // Get unique tickers
    const tickers = [...new Set(trades.map(t => t.code))]
    logger.info('Tickers found:', tickers)
    
    // Fetch all historical prices in parallel
    logger.info('Fetching historical prices...')
    const priceDataPromises = tickers.map(async (ticker) => {
      try {
        let yfinanceTicker = ticker
        if (ticker === 'MFT') {
          yfinanceTicker = 'MFT.NZ'
        }
        
        const quotes = await yahooFinance.historical(yfinanceTicker, {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        })
        
        const priceMap = new Map<string, number>()
        quotes.forEach(quote => {
          const dateStr = quote.date.toISOString().split('T')[0]
          priceMap.set(dateStr, quote.close)
        })
        
        return { ticker, priceMap }
      } catch (error) {
        logger.error(`Error fetching prices for ${ticker}:`, error)
        return { ticker, priceMap: new Map<string, number>() }
      }
    })
    
    // Fetch exchange rates
    logger.info('Fetching exchange rates...')
    const exchangeRatePromise = yahooFinance.historical('NZDUSD=X', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    }).then(quotes => {
      const rateMap = new Map<string, number>()
      quotes.forEach(quote => {
        const dateStr = quote.date.toISOString().split('T')[0]
        rateMap.set(dateStr, 1 / quote.close) // Convert NZD/USD to USD/NZD
      })
      return rateMap
    }).catch(() => new Map<string, number>())
    
    const [priceDataArray, exchangeRates] = await Promise.all([
      Promise.all(priceDataPromises),
      exchangeRatePromise
    ])
    
    // Create ticker price map
    const tickerPriceMap = new Map<string, Map<string, number>>()
    priceDataArray.forEach(({ ticker, priceMap }) => {
      tickerPriceMap.set(ticker, priceMap)
    })
    
    // Fill forward missing prices
    const filledPriceMap = new Map<string, Map<string, number>>()
    tickers.forEach(ticker => {
      const priceMap = tickerPriceMap.get(ticker) || new Map()
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
      
      filledPriceMap.set(ticker, filledMap)
    })
    
    // Fill forward exchange rates
    const filledExchangeRates = new Map<string, number>()
    let lastRate = FALLBACK_USD_TO_NZD_RATE
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      if (exchangeRates.has(dateStr)) {
        lastRate = exchangeRates.get(dateStr)!
        filledExchangeRates.set(dateStr, lastRate)
      } else {
        filledExchangeRates.set(dateStr, lastRate)
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Calculate compositions for each date
    logger.info('Calculating daily compositions...')
    const compositions: CompositionData = {}
    const holdings = new Map<string, {
      symbol: string
      name: string
      shares: number
      currency: string
    }>()
    
    const processDate = new Date(startDate)
    while (processDate <= endDate) {
      const dateStr = processDate.toISOString().split('T')[0]
      
      // Process trades for this day
      const todaysTrades = trades.filter(t => t.date === dateStr)
      todaysTrades.forEach(trade => {
        const current = holdings.get(trade.code) || {
          symbol: trade.code,
          name: trade.name,
          shares: 0,
          currency: trade.instrumentCurrency
        }
        
        if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
          current.shares += trade.qty
        } else if (trade.type === 'Sell') {
          current.shares += trade.qty // qty is negative for sells
        }
        
        if (current.shares > 0.001) { // Small threshold to handle floating point
          holdings.set(trade.code, current)
        } else {
          holdings.delete(trade.code)
        }
      })
      
      // Calculate portfolio values for this date
      let totalValue = 0
      const holdingsWithValues: HoldingAtDate[] = []
      
      holdings.forEach(holding => {
        const priceMap = filledPriceMap.get(holding.symbol)
        const price = priceMap?.get(dateStr) || 0
        const exchangeRate = filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
        
        const valueInCurrency = holding.shares * price
        const valueNZD = holding.currency === 'USD' 
          ? valueInCurrency * exchangeRate 
          : valueInCurrency
        
        if (valueNZD > 0) {
          totalValue += valueNZD
          holdingsWithValues.push({
            symbol: holding.symbol,
            name: holding.name,
            shares: holding.shares,
            value: valueNZD,
            percentage: 0,
            currency: holding.currency
          })
        }
      })
      
      // Calculate percentages and sort
      holdingsWithValues.forEach(holding => {
        holding.percentage = (holding.value / totalValue) * 100
      })
      holdingsWithValues.sort((a, b) => b.value - a.value)
      
      // Only store if there are holdings
      if (holdingsWithValues.length > 0) {
        compositions[dateStr] = holdingsWithValues
      }
      
      processDate.setDate(processDate.getDate() + 1)
    }
    
    logger.info(`Successfully calculated ${Object.keys(compositions).length} daily compositions`)
    return compositions
    
  } catch (error) {
    logger.error('Error calculating portfolio compositions:', error)
    throw error
  }
}

/**
 * Cached version of calculatePortfolioCompositions
 * This function will cache the results for the specified duration
 */
const getCachedPortfolioCompositions = unstable_cache(
  calculatePortfolioCompositions,
  ['portfolio-compositions'],
  {
    revalidate: false, // Don't auto-revalidate, we'll manually invalidate
    tags: ['portfolio-compositions', 'portfolio-all']
  }
)

export async function GET() {
  try {
    // Fetch cached portfolio compositions
    const compositions = await getCachedPortfolioCompositions()
    
    // Return without HTTP cache headers - relying on Next.js unstable_cache instead
    return NextResponse.json(compositions)
    
  } catch (error) {
    logger.error('Error in portfolio compositions endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio compositions' },
      { status: 500 }
    )
  }
}