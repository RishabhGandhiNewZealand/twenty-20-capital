import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE, FALLBACK_NZD_TO_USD_RATE, MIN_SHARE_THRESHOLD } from '@/lib/constants'
import yahooFinance from 'yahoo-finance2'
import { getCachedTradeData } from '@/lib/trade-data-cache'

interface CurrentHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  currentValueNZD: number
  costBasisNZD: number
  gainNZD: number
  gainPercent: number
  allocation: number
  currency: string
}

/**
 * Fetches the current market price for a given stock ticker
 * 
 * @param ticker - Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
 * @returns Current market price in the stock's native currency
 * @throws Will return 0 if the price cannot be fetched
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

// Get current USD/NZD exchange rate
async function getCurrentUSDNZDRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('NZDUSD=X')
    return 1 / (quote.regularMarketPrice || FALLBACK_NZD_TO_USD_RATE)
  } catch (error) {
    logger.error('Error fetching USD/NZD rate:', error)
    return FALLBACK_USD_TO_NZD_RATE
  }
}

// Get historical price for a specific date
async function getHistoricalPrice(ticker: string, date: Date): Promise<number> {
  try {
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    
    const quotes = await yahooFinance.historical(ticker, {
      period1: date,
      period2: endDate,
      interval: '1d'
    })

    return quotes.length > 0 ? quotes[0].close : 0
  } catch (error) {
    logger.error(`Error fetching historical price for ${ticker} on ${date}:`, error)
    return 0
  }
}

export async function GET() {
  try {
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    // If no trades found, return empty response
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return NextResponse.json({
        holdings: [],
        summary: {
          totalValueNZD: 0,
          totalCostBasisNZD: 0,
          totalGainNZD: 0,
          totalGainPercent: 0,
          sp500Value: 0,
          sp500GainNZD: 0,
          sp500GainPercent: 0,
          exchangeRate: await getCurrentUSDNZDRate()
        },
        lastUpdated: new Date().toISOString()
      })
    }

    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Get current holdings by symbol
    const holdingsBySymbol = new Map<string, {
      shares: number
      totalCostNZD: number
      name: string
      currency: string
    }>()

    // Track S&P 500 shares purchased over time
    let sp500Shares = 0
    let currentCostBasis = 0
    let soldCapitalAvailable = 0

    // Get all unique trade dates for SPY price fetching
    const tradeDates = [...new Set(trades.filter(t => t.type === 'Buy').map(t => t.date))]
    
    // Fetch historical SPY prices for all trade dates
    const spyHistoricalPrices = await Promise.all(
      tradeDates.map(async (dateStr) => {
        const date = new Date(dateStr)
        const price = await getHistoricalPrice('SPY', date)
        return { date: dateStr, price }
      })
    )

    // Create a map for quick lookup
    const spyPriceMap = new Map(spyHistoricalPrices.map(p => [p.date, p.price]))

    // Process trades to calculate current holdings and S&P 500 equivalent
    for (const trade of trades) {
      const current = holdingsBySymbol.get(trade.code) || {
        shares: 0,
        totalCostNZD: 0,
        name: trade.name,
        currency: trade.instrumentCurrency
      }

      const exchangeRate = trade.instrumentCurrency === 'USD' ? (1 / trade.exchRate) : 1
      const tradeValueNZD = Math.abs(trade.qty * trade.price * exchangeRate)

      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        current.shares += trade.qty
        if (trade.type === 'Buy') {
          // Only count buys in cost basis, not reinvestments
          current.totalCostNZD += tradeValueNZD

          // Calculate S&P 500 shares that could have been bought
          if (soldCapitalAvailable >= tradeValueNZD) {
            soldCapitalAvailable -= tradeValueNZD
          } else {
            const newCapital = tradeValueNZD - soldCapitalAvailable
            currentCostBasis += newCapital
            soldCapitalAvailable = 0

            // Calculate SPY shares with this new capital
            const spyPrice = spyPriceMap.get(trade.date) || 0
            if (spyPrice > 0) {
              // Get historical exchange rate for this date
              const spyPriceNZD = spyPrice * exchangeRate
              sp500Shares += newCapital / spyPriceNZD
            }
          }
        }
      } else if (trade.type === 'Sell') {
        current.shares += trade.qty // qty is negative for sells
        // Proportionally reduce cost basis
        if (current.shares > 0 && trade.qty < 0) {
          const sellRatio = Math.abs(trade.qty) / (current.shares - trade.qty)
          current.totalCostNZD *= (1 - sellRatio)
        }
        soldCapitalAvailable += tradeValueNZD
      }

      if (current.shares > MIN_SHARE_THRESHOLD) { // Only keep positions with shares
        holdingsBySymbol.set(trade.code, current)
      } else {
        holdingsBySymbol.delete(trade.code)
      }
    }

    // Get current prices and exchange rate
    const currentExchangeRate = await getCurrentUSDNZDRate()
    const tickers = Array.from(holdingsBySymbol.keys())
    
    // Fetch all current prices in parallel, including SPY
    const prices = await Promise.all([
      ...tickers.map(ticker => getCurrentPrice(ticker)),
      getCurrentPrice('SPY')
    ])

    // Create price map
    const priceMap = new Map<string, number>()
    tickers.forEach((ticker, index) => {
      priceMap.set(ticker, prices[index])
    })
    const currentSpyPrice = prices[prices.length - 1]

    // Calculate current values
    const holdings: CurrentHolding[] = []
    let totalValueNZD = 0

    holdingsBySymbol.forEach((holding, symbol) => {
      const currentPrice = priceMap.get(symbol) || 0
      const currentValueNZD = holding.shares * currentPrice * (holding.currency === 'USD' ? currentExchangeRate : 1)
      
      holdings.push({
        symbol,
        name: holding.name,
        shares: holding.shares,
        currentPrice,
        currentValueNZD,
        costBasisNZD: holding.totalCostNZD,
        gainNZD: currentValueNZD - holding.totalCostNZD,
        gainPercent: holding.totalCostNZD > 0 ? ((currentValueNZD - holding.totalCostNZD) / holding.totalCostNZD * 100) : 0,
        allocation: 0, // Will calculate after total
        currency: holding.currency
      })

      totalValueNZD += currentValueNZD
    })

    // Calculate allocations
    holdings.forEach(holding => {
      holding.allocation = (holding.currentValueNZD / totalValueNZD) * 100
    })

    // Sort by allocation descending
    holdings.sort((a, b) => b.allocation - a.allocation)

    // Calculate total gain
    const totalGainNZD = totalValueNZD - currentCostBasis
    const totalGainPercent = currentCostBasis > 0 ? (totalGainNZD / currentCostBasis * 100) : 0

    // Calculate S&P 500 equivalent value
    const sp500ValueUSD = sp500Shares * currentSpyPrice
    const sp500Value = sp500ValueUSD * currentExchangeRate
    const sp500GainNZD = sp500Value - currentCostBasis
    const sp500GainPercent = currentCostBasis > 0 ? (sp500GainNZD / currentCostBasis * 100) : 0

    return NextResponse.json({
      holdings,
      summary: {
        totalValueNZD,
        totalCostBasisNZD: currentCostBasis,
        totalGainNZD,
        totalGainPercent,
        sp500Value,
        sp500GainNZD,
        sp500GainPercent,
        exchangeRate: currentExchangeRate
      },
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=1800',
      }
    })
  } catch (error) {
    logger.error('Error calculating current portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to calculate current portfolio' },
      { status: 500 }
    )
  }
}