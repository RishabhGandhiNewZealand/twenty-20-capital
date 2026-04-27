/**
 * Portfolio Calculations Module
 * 
 * This module contains the core calculation logic for portfolio metrics
 * including daily returns, portfolio values, and performance comparisons.
 */

import { TradeRecord } from '@/types/portfolio'
import { logger } from './logger'
import { FALLBACK_USD_TO_NZD_RATE, FALLBACK_AUD_TO_NZD_RATE } from './constants'

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

/**
 * Get the nearest available price from a price map
 */
function getNearestPrice(
  dateStr: string, 
  priceMap: Map<string, number>,
  lookbackDays: number = 5
): number {
  // First try the exact date
  if (priceMap.has(dateStr)) {
    return priceMap.get(dateStr)!
  }
  
  // Look for the nearest price within lookback days
  const targetDate = new Date(dateStr)
  for (let i = 1; i <= lookbackDays; i++) {
    // Try future dates
    const futureDate = new Date(targetDate)
    futureDate.setDate(futureDate.getDate() + i)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    if (priceMap.has(futureDateStr)) {
      return priceMap.get(futureDateStr)!
    }
    
    // Try past dates
    const pastDate = new Date(targetDate)
    pastDate.setDate(pastDate.getDate() - i)
    const pastDateStr = pastDate.toISOString().split('T')[0]
    if (priceMap.has(pastDateStr)) {
      return priceMap.get(pastDateStr)!
    }
  }
  
  return 0
}

/**
 * Calculate daily portfolio returns and values
 */
export function calculateDailyReturns(
  trades: TradeRecord[],
  tickerPrices: Map<string, Map<string, number>>,
  exchangeRates: Map<string, number>,
  spyPrices: Map<string, number>,
  startDate: Date,
  endDate: Date,
  audExchangeRates: Map<string, number> = new Map()
): DailyPortfolioData[] {
  
  // Sort trades by date, and within the same date: Sells first, then Buys, then Reinvestments
  const sortedTrades = [...trades].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCompare !== 0) return dateCompare
    
    // Same date - sort by type: Sell -> Buy -> Reinvestment
    const typeOrder = { 'Sell': 0, 'Buy': 1, 'Reinvestment': 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })

  // Get unique tickers
  const tickers = [...new Set(trades.map(t => t.code))]

  // Calculate daily holdings
  const dailyHoldings = new Map<string, Map<string, number>>() // date -> ticker -> shares
  const currentHoldings = new Map<string, number>() // ticker -> shares

  // Initialize holdings for all tickers
  tickers.forEach(ticker => currentHoldings.set(ticker, 0))

  // Process each day to build holdings
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    // Process trades for this day
    const todaysTrades = sortedTrades.filter(t => t.date === dateStr)
    todaysTrades.forEach(trade => {
      const currentShares = currentHoldings.get(trade.code) || 0
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        currentHoldings.set(trade.code, currentShares + trade.qty)
      } else if (trade.type === 'Sell') {
        // qty is positive in database, so we need to subtract for sells
        currentHoldings.set(trade.code, Math.max(0, currentShares - Math.abs(trade.qty)))
      }
    })

    // Save holdings for this day
    const holdingsSnapshot = new Map(currentHoldings)
    dailyHoldings.set(dateStr, holdingsSnapshot)

    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calculate capital flow and S&P 500 equivalent
  let runningCostBasis = 0
  let runningSoldCapital = 0
  let runningSp500Shares = 0
  let runningSp500CostBasis = 0
  
  // Maps to store the state at each date
  const costBasisByDate = new Map<string, number>()
  const sp500SharesByDate = new Map<string, number>()
  const sp500CostBasisByDate = new Map<string, number>()
  
  // Process all trades in chronological order to build up the capital flow
  logger.debug('Processing trades to calculate capital flow...')
  sortedTrades.forEach(trade => {
    const dateStr = trade.date
    
    // Use the actual NZD value from the trade
    const tradeValueNZD = Math.abs(trade.value)
    
    if (trade.type === 'Buy') {
      // Check if this buy is using sold capital or new capital
      if (runningSoldCapital >= tradeValueNZD) {
        // This buy is fully covered by previous sells - not new capital
        runningSoldCapital -= tradeValueNZD
        logger.debug(`Trade ${dateStr}: Buy ${trade.code} using sold capital`, {
          tradeValue: tradeValueNZD.toFixed(2),
          remainingSoldCapital: runningSoldCapital.toFixed(2)
        })
      } else {
        // This buy requires new capital (partially or fully)
        const newCapital = tradeValueNZD - runningSoldCapital
        runningCostBasis += newCapital
        runningSoldCapital = 0
        
        // Only buy S&P 500 shares with truly new capital
        const spyPrice = getNearestPrice(dateStr, spyPrices)
        if (spyPrice > 0) {
          const spyExchangeRate = exchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
          const spyPriceNZD = spyPrice * spyExchangeRate
          const newSp500Shares = newCapital / spyPriceNZD
          runningSp500Shares += newSp500Shares
          runningSp500CostBasis += newCapital
          logger.debug(`Trade ${dateStr}: Buy ${trade.code} with NEW capital`, {
            newCapital: newCapital.toFixed(2),
            totalCostBasis: runningCostBasis.toFixed(2),
            newSp500Shares: newSp500Shares.toFixed(4)
          })
        }
      }
    } else if (trade.type === 'Sell') {
      // Add sold capital to available pool for re-investment
      runningSoldCapital += tradeValueNZD
      logger.debug(`Trade ${dateStr}: Sell ${trade.code}`, {
        sellValue: tradeValueNZD.toFixed(2),
        totalSoldCapital: runningSoldCapital.toFixed(2)
      })
    } else if (trade.type === 'Reinvestment') {
      // Reinvestment doesn't affect cost basis or S&P 500 purchases
      logger.debug(`Trade ${dateStr}: Reinvestment ${trade.code} - no cost basis change`)
    }
    
    // Store the state after this trade
    costBasisByDate.set(dateStr, runningCostBasis)
    sp500SharesByDate.set(dateStr, runningSp500Shares)
    sp500CostBasisByDate.set(dateStr, runningSp500CostBasis)
  })
  
  logger.info('Capital flow calculation complete', {
    finalCostBasis: runningCostBasis.toFixed(2),
    finalSp500Shares: runningSp500Shares.toFixed(4)
  })
  
  // Generate daily portfolio values
  const portfolioHistory: DailyPortfolioData[] = []
  const processDate = new Date(startDate)
  let lastCostBasis = 0
  let lastSp500Shares = 0
  let lastSp500CostBasis = 0
  
  while (processDate <= endDate) {
    const dateStr = processDate.toISOString().split('T')[0]
    const holdings = dailyHoldings.get(dateStr) || new Map()
    
    // Update cost basis and S&P 500 shares if there were trades on this date
    if (costBasisByDate.has(dateStr)) {
      lastCostBasis = costBasisByDate.get(dateStr)!
    }
    if (sp500SharesByDate.has(dateStr)) {
      lastSp500Shares = sp500SharesByDate.get(dateStr)!
    }
    if (sp500CostBasisByDate.has(dateStr)) {
      lastSp500CostBasis = sp500CostBasisByDate.get(dateStr)!
    }
    
    // Calculate portfolio value for this day
    let portfolioValue = 0
    const exchangeRate = exchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
    
    holdings.forEach((shares, ticker) => {
      if (shares > 0) {
        const priceMap = tickerPrices.get(ticker)
        if (priceMap) {
          const price = priceMap.get(dateStr) || 0
          if (price > 0) {
            const instrumentCurrency = sortedTrades.find(t => t.code === ticker)?.instrumentCurrency
            let fxRate = 1
            if (instrumentCurrency === 'USD') {
              fxRate = exchangeRate
            } else if (instrumentCurrency === 'AUD') {
              fxRate = audExchangeRates.get(dateStr) || FALLBACK_AUD_TO_NZD_RATE
            }
            portfolioValue += shares * price * fxRate
          }
        }
      }
    })
    
    // Calculate S&P 500 value for this day
    const spyPrice = spyPrices.get(dateStr) || 0
    const sp500Value = lastSp500Shares * spyPrice * exchangeRate
    
    // Only add to history if we have valid data
    if (portfolioValue > 0 || lastCostBasis > 0) {
      portfolioHistory.push({
        date: dateStr,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        costBasis: Math.round(lastCostBasis * 100) / 100,
        sp500Value: Math.round(sp500Value * 100) / 100
      })
    }
    
    processDate.setDate(processDate.getDate() + 1)
  }
  
  return portfolioHistory
}