import { NextRequest, NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const trades = await getCachedTradeData(userId)
    if (!trades || trades.length === 0) {
      return NextResponse.json({})
    }

    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const startDate = new Date(trades[0].date)
    const endDate = new Date()

    const tickers = [...new Set(trades.map(t => t.code))]

    const priceDataPromises = tickers.map(async (ticker) => {
      try {
        let yfinanceTicker = ticker
        if (ticker === 'MFT') yfinanceTicker = 'MFT.NZ'
        const quotes = await yahooFinance.historical(yfinanceTicker, { period1: startDate, period2: endDate, interval: '1d' })
        const priceMap = new Map<string, number>()
        quotes.forEach(q => priceMap.set(q.date.toISOString().split('T')[0], q.close))
        return { ticker, priceMap }
      } catch (error) {
        logger.error(`Error fetching prices for ${ticker}:`, error)
        return { ticker, priceMap: new Map<string, number>() }
      }
    })

    const exchangeRatePromise = yahooFinance.historical('NZDUSD=X', { period1: startDate, period2: endDate, interval: '1d' })
      .then(quotes => {
        const rateMap = new Map<string, number>()
        quotes.forEach(q => rateMap.set(q.date.toISOString().split('T')[0], 1 / q.close))
        return rateMap
      }).catch(() => new Map<string, number>())

    const [priceDataArray, exchangeRates] = await Promise.all([Promise.all(priceDataPromises), exchangeRatePromise])

    const tickerPriceMap = new Map<string, Map<string, number>>()
    priceDataArray.forEach(({ ticker, priceMap }) => { tickerPriceMap.set(ticker, priceMap) })

    // Fill forward helpers
    const fillForwardMap = (map: Map<string, number>) => {
      const filled = new Map<string, number>()
      let last: number | null = null
      const cur = new Date(startDate)
      while (cur <= endDate) {
        const ds = cur.toISOString().split('T')[0]
        if (map.has(ds)) { last = map.get(ds)!; filled.set(ds, last) }
        else if (last !== null) filled.set(ds, last)
        cur.setDate(cur.getDate() + 1)
      }
      return filled
    }

    const filledPrices = new Map<string, Map<string, number>>()
    tickers.forEach(t => filledPrices.set(t, fillForwardMap(tickerPriceMap.get(t) || new Map())))
    const filledExchangeRates = fillForwardMap(exchangeRates)

    const compositions: Record<string, any[]> = {}
    const holdings = new Map<string, { symbol: string, name: string, shares: number, currency: string }>()

    const processDate = new Date(startDate)
    while (processDate <= endDate) {
      const dateStr = processDate.toISOString().split('T')[0]

      const todaysTrades = trades.filter(t => t.date === dateStr)
      todaysTrades.forEach(trade => {
        const cur = holdings.get(trade.code) || { symbol: trade.code, name: trade.name, shares: 0, currency: trade.instrumentCurrency }
        if (trade.type === 'Buy' || trade.type === 'Reinvestment') cur.shares += trade.qty
        else if (trade.type === 'Sell') cur.shares += trade.qty
        if (cur.shares > 0.001) holdings.set(trade.code, cur) else holdings.delete(trade.code)
      })

      let totalValue = 0
      const dayHoldings: any[] = []
      holdings.forEach(h => {
        const price = (filledPrices.get(h.symbol)?.get(dateStr) || 0)
        const rate = filledExchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
        const valueInCurrency = h.shares * price
        const valueNZD = h.currency === 'USD' ? valueInCurrency * rate : valueInCurrency
        if (valueNZD > 0) {
          totalValue += valueNZD
          dayHoldings.push({ symbol: h.symbol, name: h.name, shares: h.shares, value: valueNZD, percentage: 0, currency: h.currency })
        }
      })

      dayHoldings.forEach(dh => { dh.percentage = totalValue > 0 ? (dh.value / totalValue) * 100 : 0 })
      dayHoldings.sort((a, b) => b.value - a.value)
      if (dayHoldings.length > 0) compositions[dateStr] = dayHoldings

      processDate.setDate(processDate.getDate() + 1)
    }

    return NextResponse.json(compositions)
  } catch (error) {
    logger.error('Error in user portfolio compositions endpoint:', error)
    return NextResponse.json({ error: 'Failed to calculate portfolio compositions' }, { status: 500 })
  }
}