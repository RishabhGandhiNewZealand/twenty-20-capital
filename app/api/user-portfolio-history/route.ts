import { NextRequest, NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import yahooFinance from 'yahoo-finance2'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || ''
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trades = await getCachedTradeData(userId)
  if (!trades || trades.length === 0) {
    return NextResponse.json({ history: [], lastUpdated: new Date().toISOString(), cached: false })
  }

  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const startDate = new Date(sorted[0].date)
  const endDate = new Date()

  const tickers = [...new Set(sorted.map(t => t.code))]

  const priceDataPromises = tickers.map(async (ticker) => {
    try {
      let yfinanceTicker = ticker
      if (ticker === 'MFT') yfinanceTicker = 'MFT.NZ'
      const quotes = await yahooFinance.historical(yfinanceTicker, { period1: startDate, period2: endDate, interval: '1d' })
      const priceMap = new Map<string, number>()
      quotes.forEach(q => priceMap.set(q.date.toISOString().split('T')[0], q.close))
      return { ticker, priceMap }
    } catch (e) {
      return { ticker, priceMap: new Map<string, number>() }
    }
  })

  const exchangeRatesPromise = yahooFinance.historical('NZDUSD=X', { period1: startDate, period2: endDate, interval: '1d' })
    .then(quotes => {
      const rateMap = new Map<string, number>()
      quotes.forEach(q => rateMap.set(q.date.toISOString().split('T')[0], 1 / q.close))
      return rateMap
    }).catch(() => {
      const m = new Map<string, number>()
      const d = new Date(startDate)
      while (d <= endDate) {
        m.set(d.toISOString().split('T')[0], FALLBACK_USD_TO_NZD_RATE)
        d.setDate(d.getDate() + 1)
      }
      return m
    })

  const spyPromise = yahooFinance.historical('SPY', { period1: startDate, period2: endDate, interval: '1d' })
    .then(quotes => {
      const priceMap = new Map<string, number>()
      quotes.forEach(q => priceMap.set(q.date.toISOString().split('T')[0], q.close))
      return priceMap
    }).catch(() => new Map<string, number>())

  const [priceDataArray, exchangeRates, spyPrices] = await Promise.all([
    Promise.all(priceDataPromises),
    exchangeRatesPromise,
    spyPromise
  ])

  const tickerPriceMap = new Map<string, Map<string, number>>()
  priceDataArray.forEach(({ ticker, priceMap }) => {
    tickerPriceMap.set(ticker, priceMap)
  })

  const history = calculateDailyReturns(sorted, tickerPriceMap, exchangeRates, spyPrices, startDate, endDate)

  return NextResponse.json({
    history,
    lastUpdated: new Date().toISOString(),
    cached: false
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}