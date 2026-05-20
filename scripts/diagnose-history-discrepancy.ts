import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') })

import { getCachedTradeData } from '../lib/trade-data-cache'
import { calculatePortfolioData } from '../lib/portfolio'
import yahooFinance from '../lib/yahoo-finance'

// Helper functions from cache service
async function getHistoricalPrices(
  ticker: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, number>> {
  try {
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    } else if (ticker === 'WTC.AX') {
      yfinanceTicker = 'WTC.AX'
    }

    const result = await yahooFinance.chart(yfinanceTicker, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    }, { validateResult: false })

    const priceMap = new Map<string, number>()
    if (result && result.quotes) {
      result.quotes.forEach((quote: any) => {
        if (quote.close !== null && quote.close !== undefined) {
          const dateStr = quote.date.toISOString().split('T')[0]
          priceMap.set(dateStr, quote.close)
        }
      })
    }

    return priceMap
  } catch (error) {
    console.error(`Error fetching historical prices for ${ticker}:`, error)
    return new Map()
  }
}

async function getUSDNZDRate(startDate: Date, endDate: Date): Promise<Map<string, number>> {
  try {
    const result = await yahooFinance.chart('NZDUSD=X', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    }, { validateResult: false })

    const rateMap = new Map<string, number>()
    if (result && result.quotes) {
      result.quotes.forEach((quote: any) => {
        if (quote.close !== null && quote.close !== undefined) {
          const dateStr = quote.date.toISOString().split('T')[0]
          rateMap.set(dateStr, 1 / quote.close)
        }
      })
    }

    return rateMap
  } catch (error) {
    console.error('Error fetching historical USD/NZD rate:', error)
    return new Map()
  }
}

function fillMissingDates(
  priceMap: Map<string, number>,
  startDate: Date,
  endDate: Date
): Map<string, number> {
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

async function getCurrentPrice(ticker: string): Promise<number> {
  try {
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    } else if (ticker === 'WTC.AX') {
      yfinanceTicker = 'WTC.AX'
    }

    const quote = await yahooFinance.quote(yfinanceTicker)
    return (quote as any).regularMarketPrice || 0
  } catch (error) {
    return 0
  }
}

async function main() {
  try {
    const adminUserId = process.env.ADMIN_USER_ID || ''
    const trades = await getCachedTradeData(adminUserId)
    const { holdings } = calculatePortfolioData(trades)
    
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    const targetDateStr = endDate.toISOString().split('T')[0]
    
    console.log(`Target Date for History check: ${targetDateStr}`)
    
    // Fetch USD/NZD
    const exchangeRates = await getUSDNZDRate(startDate, endDate)
    const filledExchangeRates = fillMissingDates(exchangeRates, startDate, endDate)
    const histExchangeRate = filledExchangeRates.get(targetDateStr) || 1.65
    
    // Current USD/NZD
    const currExchangeRateQuote = await yahooFinance.quote('NZDUSD=X')
    const currExchangeRate = 1 / ((currExchangeRateQuote as any).regularMarketPrice || 0.606)
    
    console.log(`Exchange Rates on ${targetDateStr}:`)
    console.log(`- History: ${histExchangeRate.toFixed(4)}`)
    console.log(`- Current Quote: ${currExchangeRate.toFixed(4)}`)
    console.log(`- Difference: ${(currExchangeRate - histExchangeRate).toFixed(4)}\n`)

    console.log(String.prototype.padEnd('SYMBOL', 10) + ' | ' + String.prototype.padEnd('SHARES', 8) + ' | ' + String.prototype.padEnd('HIST PRICE', 12) + ' | ' + String.prototype.padEnd('CURR PRICE', 12) + ' | ' + String.prototype.padEnd('HIST VAL NZD', 15) + ' | ' + String.prototype.padEnd('CURR VAL NZD', 15) + ' | DIFF NZD')
    console.log('-'.repeat(100))

    let totalHistNZD = 0
    let totalCurrNZD = 0

    for (const h of holdings) {
      // Historical
      const rawPrices = await getHistoricalPrices(h.symbol, startDate, endDate)
      const filledPrices = fillMissingDates(rawPrices, startDate, endDate)
      const histPrice = filledPrices.get(targetDateStr) || 0
      
      const isUSD = h.instrumentCurrency === 'USD'
      let histValNZD = 0
      if (h.symbol === 'WTC.AX') {
        const audNzdQuote = await yahooFinance.quote('AUDNZD=X').catch(() => null)
        const audNzdRate = audNzdQuote ? (audNzdQuote as any).regularMarketPrice : 1.10
        histValNZD = h.totalShares * histPrice * audNzdRate
      } else {
        histValNZD = isUSD ? h.totalShares * histPrice * histExchangeRate : h.totalShares * histPrice
      }
      
      totalHistNZD += histValNZD

      // Current
      const currPrice = await getCurrentPrice(h.symbol)
      let currValNZD = 0
      if (h.symbol === 'WTC.AX') {
        const audNzdQuote = await yahooFinance.quote('AUDNZD=X').catch(() => null)
        const audNzdRate = audNzdQuote ? (audNzdQuote as any).regularMarketPrice : 1.10
        currValNZD = h.totalShares * currPrice * audNzdRate
      } else {
        currValNZD = isUSD ? h.totalShares * currPrice * currExchangeRate : h.totalShares * currPrice
      }
      
      totalCurrNZD += currValNZD

      const diff = currValNZD - histValNZD

      console.log(
        h.symbol.padEnd(10) + ' | ' +
        h.totalShares.toString().padEnd(8) + ' | ' +
        histPrice.toFixed(2).padStart(12) + ' | ' +
        currPrice.toFixed(2).padStart(12) + ' | ' +
        histValNZD.toFixed(2).padStart(15) + ' | ' +
        currValNZD.toFixed(2).padStart(15) + ' | ' +
        diff.toFixed(2).padStart(10)
      )
    }

    console.log('-'.repeat(100))
    console.log(`TOTAL PORTFOLIO VALUE (HISTORICAL): NZ$${totalHistNZD.toFixed(2)}`)
    console.log(`TOTAL PORTFOLIO VALUE (CURRENT):    NZ$${totalCurrNZD.toFixed(2)}`)
    console.log(`TOTAL DIFFERENCE:                   NZ$${(totalCurrNZD - totalHistNZD).toFixed(2)}`)

    process.exit(0)
  } catch (error) {
    console.error('Error in main:', error)
    process.exit(1)
  }
}

main()
