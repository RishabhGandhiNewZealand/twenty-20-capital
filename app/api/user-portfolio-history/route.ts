import { NextRequest, NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import yahooFinance from '@/lib/yahoo-finance'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

function fillMissingDates(priceMap: Map<string, number>, startDate: Date, endDate: Date): Map<string, number> {
  const filled = new Map<string, number>()
  let last: number | null = null
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const ds = cur.toISOString().split('T')[0]
    if (priceMap.has(ds)) {
      last = priceMap.get(ds)!
      filled.set(ds, last)
    } else if (last !== null) {
      filled.set(ds, last)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return filled
}

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
        ; (quotes as any).forEach((q: any) => priceMap.set(q.date.toISOString().split('T')[0], q.close))
      return { ticker, priceMap }
    } catch (e) {
      return { ticker, priceMap: new Map<string, number>() }
    }
  })

  const exchangeRatesPromise = yahooFinance.historical('NZDUSD=X', { period1: startDate, period2: endDate, interval: '1d' })
    .then(quotes => {
      const m = new Map<string, number>()
        ; (quotes as any).forEach((q: any) => m.set(q.date.toISOString().split('T')[0], 1 / q.close))
      return m
    })
    .catch(() => {
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
      const m = new Map<string, number>()
        ; (quotes as any).forEach((q: any) => m.set(q.date.toISOString().split('T')[0], q.close))
      return m
    })
    .catch(() => new Map<string, number>())

  const [priceDataArray, exchangeRatesRaw, spyPricesRaw] = await Promise.all([
    Promise.all(priceDataPromises),
    exchangeRatesPromise,
    spyPromise
  ])

  // Fill forward missing dates for consistency
  const tickerPriceMap = new Map<string, Map<string, number>>()
  priceDataArray.forEach(({ ticker, priceMap }) => {
    tickerPriceMap.set(ticker, fillMissingDates(priceMap, startDate, endDate))
  })
  const exchangeRates = fillMissingDates(exchangeRatesRaw, startDate, endDate)
  const spyPrices = fillMissingDates(spyPricesRaw, startDate, endDate)

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