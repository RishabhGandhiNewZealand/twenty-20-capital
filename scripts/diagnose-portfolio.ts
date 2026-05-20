import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') })

import { getCachedTradeData } from '../lib/trade-data-cache'
import { calculatePortfolioData } from '../lib/portfolio'
import yahooFinance from 'yahoo-finance2'

async function main() {
  try {
    const adminUserId = process.env.ADMIN_USER_ID || ''
    console.log(`Using ADMIN_USER_ID: ${adminUserId}`)
    
    const trades = await getCachedTradeData(adminUserId)
    console.log(`Fetched ${trades.length} total trades.`)

    const { holdings } = calculatePortfolioData(trades)
    
    console.log('\n=== CALCULATED PORTFOLIO HOLDINGS ===')
    console.log('SYMBOL     | SHARES       | AVG PRICE (USD)    | AVG PRICE (NZD)    | CURRENCY')
    console.log('-'.repeat(80))
    
    let totalCostUSD = 0
    let totalCostNZD = 0
    for (const h of holdings) {
      console.log(
        h.symbol.padEnd(10) + ' | ' +
        h.totalShares.toString().padEnd(12) + ' | ' +
        (h.avgPriceUSD ? h.avgPriceUSD.toFixed(4) : 'N/A').padEnd(18) + ' | ' +
        h.avgPriceNZD.toFixed(4).padEnd(18) + ' | ' +
        h.instrumentCurrency
      )
      if (h.instrumentCurrency === 'USD') {
        totalCostUSD += (h.avgPriceUSD || 0) * h.totalShares
      }
      totalCostNZD += h.avgPriceNZD * h.totalShares
    }
    
    console.log('\n=== TOTAL PORTFOLIO COST BASIS ===')
    console.log(`Total Cost Basis in USD (USD holdings only): $${totalCostUSD.toFixed(2)}`)
    console.log(`Total Cost Basis in NZD (all holdings): NZ$${totalCostNZD.toFixed(2)}`)

    // Let's also print USD/NZD rate
    try {
      const quote = await yahooFinance.quote('NZDUSD=X')
      const rate = 1 / ((quote as any).regularMarketPrice || 0.606)
      console.log(`Current USD/NZD Exchange Rate: ${rate.toFixed(4)}`)
    } catch (e) {
      console.log('Failed to fetch current exchange rate')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error running diagnosis:', error)
    process.exit(1)
  }
}

main()
