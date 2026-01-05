import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import yahooFinance from '@/lib/yahoo-finance'
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

const CACHE_REVALIDATE_SECONDS = 1200
const CACHE_TAG = 'portfolio-compositions'

async function calculatePortfolioCompositions(): Promise<CompositionData> {
  try {
    logger.info('Starting portfolio composition calculation...')

    const adminUserId = process.env.ADMIN_USER_ID || ''
    const trades = await getCachedTradeData(adminUserId)

    if (!trades || trades.length === 0) {
      logger.warn('No trade data found for portfolio compositions')
      return {}
    }

    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const startDate = new Date(trades[0].date)
    const endDate = new Date()

    const tickers = [...new Set(trades.map(t => t.code))]

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
          ; (quotes as any).forEach((quote: any) => {
            const dateStr = quote.date.toISOString().split('T')[0]
            priceMap.set(dateStr, quote.close)
          })

        return { ticker, priceMap }
      } catch (error) {
        logger.error(`Error fetching prices for ${ticker}:`, error)
        return { ticker, priceMap: new Map<string, number>() }
      }
    })

    const exchangeRatePromise = yahooFinance.historical('NZDUSD=X', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    }).then(quotes => {
      const rateMap = new Map<string, number>()
        ; (quotes as any).forEach((quote: any) => {
          const dateStr = quote.date.toISOString().split('T')[0]
          rateMap.set(dateStr, 1 / quote.close)
        })
      return rateMap
    }).catch(() => new Map<string, number>())

    const [priceDataArray, exchangeRates] = await Promise.all([
      Promise.all(priceDataPromises),
      exchangeRatePromise
    ])

    const tickerPriceMap = new Map<string, Map<string, number>>()
    priceDataArray.forEach(({ ticker, priceMap }) => {
      tickerPriceMap.set(ticker, priceMap)
    })

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
          filledMap.set(dateStr, lastPrice!)
        } else if (lastPrice !== null) {
          filledMap.set(dateStr, lastPrice!)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      filledPriceMap.set(ticker, filledMap)
    })

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
          // For Sell trades, qty is typically positive (magnitude) in DB, so subtract it
          // use Math.abs just in case it was stored as negative
          current.shares -= Math.abs(trade.qty)
        }

        if (current.shares > 0.001) {
          holdings.set(trade.code, current)
        } else {
          holdings.delete(trade.code)
        }
      })

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

      holdingsWithValues.forEach(holding => {
        holding.percentage = totalValue > 0 ? ((holding.value / totalValue) * 100) : 0
      })
      holdingsWithValues.sort((a, b) => b.value - a.value)

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

const getCachedPortfolioCompositions = unstable_cache(
  calculatePortfolioCompositions,
  [CACHE_TAG],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAG]
  }
)

export async function GET() {
  try {
    const compositions = await getCachedPortfolioCompositions()

    return NextResponse.json(compositions, {
      headers: {
        'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=1800',
      }
    })

  } catch (error) {
    logger.error('Error in portfolio compositions endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio compositions' },
      { status: 500 }
    )
  }
}