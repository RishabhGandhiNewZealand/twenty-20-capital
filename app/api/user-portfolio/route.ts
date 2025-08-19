import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE, FALLBACK_NZD_TO_USD_RATE, MIN_SHARE_THRESHOLD } from '@/lib/constants'
import yahooFinance from 'yahoo-finance2'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { calculatePortfolioData } from '@/lib/portfolio'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trades = await getCachedTradeData(userId)
    if (!trades || trades.length === 0) {
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
          exchangeRate: FALLBACK_USD_TO_NZD_RATE
        },
        lastUpdated: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    const getCurrentPrice = async (ticker: string): Promise<number> => {
      try {
        let yfinanceTicker = ticker
        if (ticker === 'MFT') yfinanceTicker = 'MFT.NZ'
        const quote = await yahooFinance.quote(yfinanceTicker)
        return quote.regularMarketPrice || 0
      } catch {
        return 0
      }
    }

    const getHistoricalPrice = async (ticker: string, date: Date): Promise<number> => {
      try {
        const endDate = new Date(date)
        endDate.setDate(endDate.getDate() + 1)
        const quotes = await yahooFinance.historical(ticker, { period1: date, period2: endDate, interval: '1d' })
        return quotes.length > 0 ? quotes[0].close : 0
      } catch {
        return 0
      }
    }

    const getCurrentUSDNZDRate = async (): Promise<number> => {
      try {
        const quote = await yahooFinance.quote('NZDUSD=X')
        return 1 / (quote.regularMarketPrice || FALLBACK_NZD_TO_USD_RATE)
      } catch {
        return FALLBACK_USD_TO_NZD_RATE
      }
    }

    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Build holdings up to today (NZD basis and shares) for current values
    const holdingsBySymbol = new Map<string, { shares: number, totalCostNZD: number, name: string, currency: string }>()
    let sp500Shares = 0
    let currentCostBasis = 0
    let soldCapitalAvailable = 0

    const tradeDates = [...new Set(trades.filter(t => t.type === 'Buy').map(t => t.date))]
    const spyHistoricalPrices = await Promise.all(tradeDates.map(async (dateStr) => {
      const date = new Date(dateStr)
      const price = await getHistoricalPrice('SPY', date)
      return { date: dateStr, price }
    }))
    const spyPriceMap = new Map(spyHistoricalPrices.map(p => [p.date, p.price]))

    for (const trade of trades) {
      const current = holdingsBySymbol.get(trade.code) || { shares: 0, totalCostNZD: 0, name: trade.name, currency: trade.instrumentCurrency }
      const exchangeRate = trade.instrumentCurrency === 'USD' ? (1 / trade.exchRate) : 1
      const qty = isNaN(trade.qty) ? 0 : trade.qty
      const price = isNaN(trade.price) ? 0 : trade.price
      const tradeValueNZD = Math.abs(qty * price * exchangeRate)

      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        current.shares += qty
        if (trade.type === 'Buy') {
          current.totalCostNZD += tradeValueNZD
          if (soldCapitalAvailable >= tradeValueNZD) {
            soldCapitalAvailable -= tradeValueNZD
          } else {
            const newCapital = tradeValueNZD - soldCapitalAvailable
            currentCostBasis += newCapital
            soldCapitalAvailable = 0
            const spyPrice = spyPriceMap.get(trade.date) || 0
            if (spyPrice > 0) {
              const spyPriceNZD = spyPrice * exchangeRate
              sp500Shares += spyPriceNZD > 0 ? (newCapital / spyPriceNZD) : 0
            }
          }
        }
      } else if (trade.type === 'Sell') {
        const sharesSold = Math.abs(qty)
        const sharesBeforeSale = current.shares
        current.shares -= sharesSold
        if (current.shares > 0 && sharesBeforeSale > 0) {
          const remainingRatio = current.shares / sharesBeforeSale
          current.totalCostNZD *= remainingRatio
        } else {
          current.totalCostNZD = 0
        }
        soldCapitalAvailable += tradeValueNZD
      }

      if (current.shares > MIN_SHARE_THRESHOLD) {
        holdingsBySymbol.set(trade.code, current)
      } else {
        holdingsBySymbol.delete(trade.code)
      }
    }

    const currentExchangeRate = await getCurrentUSDNZDRate()
    const tickers = Array.from(holdingsBySymbol.keys())

    const prices = await Promise.all([
      ...tickers.map(ticker => getCurrentPrice(ticker)),
      getCurrentPrice('SPY')
    ])

    const priceMap = new Map<string, number>()
    tickers.forEach((ticker, index) => { priceMap.set(ticker, prices[index]) })
    const currentSpyPrice = prices[prices.length - 1]

    const holdings: Array<{ symbol: string, name: string, shares: number, currentPrice: number, currentValueNZD: number, costBasisNZD: number, gainNZD: number, gainPercent: number, allocation: number, currency: string, avgPriceInstrument?: number }> = []
    let totalValueNZD = 0

    holdingsBySymbol.forEach((holding, symbol) => {
      const currentPrice = priceMap.get(symbol) || 0
      const currentValueNZD = holding.shares * currentPrice * (holding.currency === 'USD' ? currentExchangeRate : 1)
      const gainNZD = currentValueNZD - holding.totalCostNZD
      const gainPercent = holding.totalCostNZD > 0 ? ((gainNZD / holding.totalCostNZD) * 100) : 0
      holdings.push({
        symbol,
        name: holding.name,
        shares: holding.shares,
        currentPrice,
        currentValueNZD,
        costBasisNZD: holding.totalCostNZD,
        gainNZD,
        gainPercent: isNaN(gainPercent) ? 0 : gainPercent,
        allocation: 0,
        currency: holding.currency
      })
      totalValueNZD += currentValueNZD
    })

    holdings.forEach(h => { h.allocation = totalValueNZD > 0 ? ((h.currentValueNZD / totalValueNZD) * 100) : 0 })
    holdings.sort((a, b) => b.allocation - a.allocation)

    // Compute avg price per instrument currency via calculatePortfolioData
    const { holdings: baseHoldings, exitedPositions } = calculatePortfolioData(trades)
    const avgMap = new Map<string, { avgPriceNZD: number, avgPriceUSD?: number }>()
    baseHoldings.forEach(h => { avgMap.set(h.symbol, { avgPriceNZD: h.avgPriceNZD, avgPriceUSD: h.avgPriceUSD }) })
    holdings.forEach(h => {
      const avg = avgMap.get(h.symbol)
      if (h.currency === 'USD') h.avgPriceInstrument = avg?.avgPriceUSD ?? 0
      else h.avgPriceInstrument = avg?.avgPriceNZD ?? 0
    })

    const totalGainNZD = totalValueNZD - currentCostBasis
    const totalGainPercent = currentCostBasis > 0 ? ((totalGainNZD / currentCostBasis) * 100) : 0

    const sp500ValueUSD = sp500Shares * currentSpyPrice
    const sp500Value = sp500ValueUSD * currentExchangeRate
    const sp500GainNZD = sp500Value - currentCostBasis
    const sp500GainPercent = currentCostBasis > 0 ? ((sp500GainNZD / currentCostBasis) * 100) : 0

    return NextResponse.json({
      holdings,
      exitedPositions,
      summary: {
        totalValueNZD: isNaN(totalValueNZD) ? 0 : totalValueNZD,
        totalCostBasisNZD: isNaN(currentCostBasis) ? 0 : currentCostBasis,
        totalGainNZD: isNaN(totalGainNZD) ? 0 : totalGainNZD,
        totalGainPercent: isNaN(totalGainPercent) ? 0 : totalGainPercent,
        sp500Value: isNaN(sp500Value) ? 0 : sp500Value,
        sp500GainNZD: isNaN(sp500GainNZD) ? 0 : sp500GainNZD,
        sp500GainPercent: isNaN(sp500GainPercent) ? 0 : sp500GainPercent,
        exchangeRate: currentExchangeRate
      },
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    logger.error('Error fetching user portfolio current data:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 })
  }
}