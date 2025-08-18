import { NextRequest, NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const targetDate = params.date
    const trades = await getCachedTradeData(userId)
    if (!trades || trades.length === 0) {
      return NextResponse.json({ date: targetDate, holdings: [], cached: false })
    }

    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const holdings = new Map<string, { symbol: string, name: string, shares: number, currency: string }>()
    for (const trade of trades) {
      if (new Date(trade.date) > new Date(targetDate)) break
      const current = holdings.get(trade.code) || { symbol: trade.code, name: trade.name, shares: 0, currency: trade.instrumentCurrency }
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        current.shares += Math.abs(trade.qty)
      } else if (trade.type === 'Sell') {
        current.shares -= Math.abs(trade.qty)
      }
      if (current.shares > 0.001) {
        holdings.set(trade.code, current)
      } else {
        holdings.delete(trade.code)
      }
    }

    const targetDateObj = new Date(targetDate)
    const startDate = new Date(targetDate); startDate.setDate(startDate.getDate() - 5)

    const holdingsArray = Array.from(holdings.values())
    const tickers = holdingsArray.map(h => h.symbol)

    const pricePromises = tickers.map(async (ticker) => {
      try {
        let yfinanceTicker = ticker
        if (ticker === 'MFT') yfinanceTicker = 'MFT.NZ'
        const quotes = await yahooFinance.historical(yfinanceTicker, { period1: startDate, period2: targetDateObj, interval: '1d' })
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

    const exchangeRatePromise = yahooFinance.historical('NZDUSD=X', { period1: startDate, period2: targetDateObj, interval: '1d' })
      .then(quotes => quotes.length > 0 ? 1 / quotes[quotes.length - 1].close : FALLBACK_USD_TO_NZD_RATE)
      .catch(() => FALLBACK_USD_TO_NZD_RATE)

    const [priceResults, exchangeRate] = await Promise.all([Promise.all(pricePromises), exchangeRatePromise])

    const priceMap = new Map(priceResults.map(r => [r.ticker, r.price]))

    let totalValue = 0
    const holdingsWithValues: any[] = []
    for (const h of holdingsArray) {
      const price = priceMap.get(h.symbol) || 0
      const valueInCurrency = h.shares * price
      const valueNZD = h.currency === 'USD' ? valueInCurrency * exchangeRate : valueInCurrency
      if (valueNZD > 0) {
        totalValue += valueNZD
        holdingsWithValues.push({ symbol: h.symbol, name: h.name, shares: h.shares, value: valueNZD, percentage: 0, currency: h.currency })
      }
    }

    holdingsWithValues.forEach(h => { h.percentage = totalValue > 0 ? (h.value / totalValue) * 100 : 0 })
    holdingsWithValues.sort((a, b) => b.value - a.value)

    return NextResponse.json({ date: targetDate, holdings: holdingsWithValues, totalValue, cached: false })
  } catch (error) {
    logger.error('Error calculating user portfolio composition:', error)
    return NextResponse.json({ error: 'Failed to calculate portfolio composition' }, { status: 500 })
  }
}