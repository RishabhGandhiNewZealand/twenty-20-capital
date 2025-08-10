import { NextRequest, NextResponse } from 'next/server'
import { getTradeData } from '@/lib/trade-data-cache'
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

// Cache for composition data
const compositionCache = new Map<string, HoldingAtDate[]>()

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const targetDate = params.date
    
    // Check if we should bypass cache
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Fetch trade data from database (with optional cache bypass)
    const trades = await getTradeData(forceRefresh)
    
    // If no trades found, return empty response
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return NextResponse.json({
        date: targetDate,
        holdings: [],
        cached: false
      })
    }
    
    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate holdings up to the target date
    const holdings = new Map<string, {
      symbol: string
      name: string
      shares: number
      currency: string
    }>()
    
    for (const trade of trades) {
      if (new Date(trade.date) > new Date(targetDate)) {
        break
      }
      
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
      
      if (current.shares > 0) {
        holdings.set(trade.code, current)
      } else {
        holdings.delete(trade.code) // Remove if position is closed
      }
    }
    
    // Get prices for the target date
    const targetDateObj = new Date(targetDate)
    const startDate = new Date(targetDate)
    startDate.setDate(startDate.getDate() - 5) // Look back 5 days for price data
    
    const holdingsArray = Array.from(holdings.values())
    const tickers = holdingsArray.map(h => h.symbol)
    
    // Fetch prices and exchange rate in parallel
    const pricePromises = tickers.map(async (ticker) => {
      try {
        let yfinanceTicker = ticker
        if (ticker === 'MFT') {
          yfinanceTicker = 'MFT.NZ'
        }
        
        const quotes = await yahooFinance.historical(yfinanceTicker, {
          period1: startDate,
          period2: targetDateObj,
          interval: '1d'
        })
        
        // Get the closest price to target date
        if (quotes.length > 0) {
          const closestQuote = quotes[quotes.length - 1]
          return { ticker, price: closestQuote.close }
        }
        return { ticker, price: 0 }
      } catch (error) {
        logger.error(`Error fetching price for ${ticker} on ${targetDate}:`, error)
        return { ticker, price: 0 }
      }
    })
    
    // Fetch exchange rate
    const exchangeRatePromise = yahooFinance.historical('NZDUSD=X', {
      period1: startDate,
      period2: targetDateObj,
      interval: '1d'
    }).then(quotes => {
      if (quotes.length > 0) {
        return 1 / quotes[quotes.length - 1].close
      }
      return FALLBACK_USD_TO_NZD_RATE
    }).catch(() => FALLBACK_USD_TO_NZD_RATE)
    
    const [priceResults, exchangeRate] = await Promise.all([
      Promise.all(pricePromises),
      exchangeRatePromise
    ])
    
    // Create price map
    const priceMap = new Map(priceResults.map(r => [r.ticker, r.price]))
    
    // Calculate portfolio values
    let totalValue = 0
    const holdingsWithValues: HoldingAtDate[] = []
    
    for (const holding of holdingsArray) {
      const price = priceMap.get(holding.symbol) || 0
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
          percentage: 0, // Will calculate after total
          currency: holding.currency
        })
      }
    }
    
    // Calculate percentages
    holdingsWithValues.forEach(holding => {
      holding.percentage = (holding.value / totalValue) * 100
    })
    
    // Sort by value descending
    holdingsWithValues.sort((a, b) => b.value - a.value)
    
    // No longer caching in memory - rely on Next.js cache
    
    return NextResponse.json({
      date: targetDate,
      holdings: holdingsWithValues,
      totalValue,
      cached: false
    })
    
  } catch (error) {
    logger.error('Error calculating portfolio composition:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio composition' },
      { status: 500 }
    )
  }
}