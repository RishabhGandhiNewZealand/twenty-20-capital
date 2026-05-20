import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') })

import { getCachedTradeData } from '../lib/trade-data-cache'
import { calculatePortfolioData } from '../lib/portfolio'
import yahooFinance from '../lib/yahoo-finance'

async function getCurrentPrice(ticker: string): Promise<{ price: number; currency: string; symbol: string }> {
  try {
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    } else if (ticker === 'WTC.AX') {
      yfinanceTicker = 'WTC.AX'
    }

    const quote = await yahooFinance.quote(yfinanceTicker)
    return {
      price: (quote as any).regularMarketPrice || 0,
      currency: (quote as any).currency || 'USD',
      symbol: yfinanceTicker
    }
  } catch (error) {
    console.error(`Error fetching current price for ${ticker}:`, error)
    return { price: 0, currency: 'USD', symbol: ticker }
  }
}

async function getCurrentUSDNZDRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('NZDUSD=X')
    return 1 / ((quote as any).regularMarketPrice || 0.606)
  } catch (error) {
    console.error('Error fetching USD/NZD rate:', error)
    return 1.65 // Fallback
  }
}

async function main() {
  try {
    const adminUserId = process.env.ADMIN_USER_ID || ''
    const trades = await getCachedTradeData(adminUserId)
    const { holdings } = calculatePortfolioData(trades)
    
    const exchangeRate = await getCurrentUSDNZDRate()
    console.log(`Current USD/NZD Exchange Rate: ${exchangeRate.toFixed(4)}\n`)

    console.log('SYMBOL     | SHARES   | YAHOO SYMBOL | CURR PRICE | CURRENCY | VALUE (NATIVE) | VALUE (NZD)')
    console.log('-'.repeat(100))

    let totalNZD = 0
    let totalUSD = 0

    for (const h of holdings) {
      const { price, currency, symbol: yfSymbol } = await getCurrentPrice(h.symbol)
      
      let valNZD = 0
      let valUSD = 0

      if (currency === 'USD') {
        valUSD = h.totalShares * price
        valNZD = valUSD * exchangeRate
        totalUSD += valUSD
      } else if (currency === 'NZD') {
        valNZD = h.totalShares * price
        valUSD = valNZD / exchangeRate
      } else if (currency === 'AUD') {
        const audNzdQuote = await yahooFinance.quote('AUDNZD=X').catch(() => null)
        const audNzdRate = audNzdQuote ? (audNzdQuote as any).regularMarketPrice : 1.10
        
        valNZD = h.totalShares * price * audNzdRate
        valUSD = valNZD / exchangeRate
        console.log(`[AUD Info] For ${h.symbol}, used AUD/NZD rate: ${audNzdRate}`)
      } else {
        valNZD = h.totalShares * price
        valUSD = valNZD / exchangeRate
      }

      totalNZD += valNZD

      console.log(
        h.symbol.padEnd(10) + ' | ' +
        h.totalShares.toString().padEnd(8) + ' | ' +
        yfSymbol.padEnd(12) + ' | ' +
        price.toFixed(2).padStart(10) + ' | ' +
        currency.padEnd(8) + ' | ' +
        (h.totalShares * price).toFixed(2).padStart(14) + ' | ' +
        valNZD.toFixed(2).padStart(12)
      )
    }

    console.log('-'.repeat(100))
    console.log(`TOTAL PORTFOLIO VALUE IN NZD: NZ$${totalNZD.toFixed(2)}`)
    console.log(`TOTAL PORTFOLIO VALUE IN USD (only USD stocks): $${totalUSD.toFixed(2)}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error in main:', error)
    process.exit(1)
  }
}

main()
