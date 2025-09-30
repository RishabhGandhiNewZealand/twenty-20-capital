/**
 * Portfolio Calculations Module V2
 * 
 * This module implements Time-Weighted Return (TWR) calculations for accurate 
 * portfolio performance measurement that eliminates the impact of cash flow timing.
 * 
 * Key Concepts:
 * - Time-Weighted Return (TWR): Measures portfolio manager/strategy performance
 *   by eliminating the impact of when you added or withdrew money
 * - Calculated by linking sub-period returns between cash flows
 * - Formula: (1 + R1) × (1 + R2) × ... × (1 + Rn) - 1
 * 
 * This is the industry standard for comparing investment performance.
 */

import { TradeRecord } from '@/types/portfolio'
import { logger } from './logger'
import { FALLBACK_USD_TO_NZD_RATE } from './constants'

/**
 * Daily portfolio data for charting
 */
export interface DailyPortfolioData {
  date: string
  portfolioValue: number
  portfolioReturn: number // Cumulative time-weighted return % from inception
  sp500Value: number
  sp500Return: number // Cumulative time-weighted return % from inception
  cashFlows: number // Net cash flow on this date (buys - sells)
  totalInvested: number // Total capital invested to date
}

/**
 * Cash flow event
 */
interface CashFlow {
  date: string
  amount: number // Positive for buys, negative for sells
  type: 'Buy' | 'Sell' | 'Reinvestment'
}

/**
 * Get the nearest available price from a price map
 */
function getNearestPrice(
  dateStr: string, 
  priceMap: Map<string, number>,
  lookbackDays: number = 5
): number {
  if (priceMap.has(dateStr)) {
    return priceMap.get(dateStr)!
  }
  
  const targetDate = new Date(dateStr)
  for (let i = 1; i <= lookbackDays; i++) {
    // Try past dates first (more conservative)
    const pastDate = new Date(targetDate)
    pastDate.setDate(pastDate.getDate() - i)
    const pastDateStr = pastDate.toISOString().split('T')[0]
    if (priceMap.has(pastDateStr)) {
      return priceMap.get(pastDateStr)!
    }
    
    // Try future dates
    const futureDate = new Date(targetDate)
    futureDate.setDate(futureDate.getDate() + i)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    if (priceMap.has(futureDateStr)) {
      return priceMap.get(futureDateStr)!
    }
  }
  
  return 0
}

/**
 * Calculate portfolio holdings for each day
 */
function calculateDailyHoldings(
  trades: TradeRecord[],
  startDate: Date,
  endDate: Date
): Map<string, Map<string, number>> {
  const dailyHoldings = new Map<string, Map<string, number>>()
  const currentHoldings = new Map<string, number>()
  
  // Get unique tickers and initialize
  const tickers = [...new Set(trades.map(t => t.code))]
  tickers.forEach(ticker => currentHoldings.set(ticker, 0))
  
  // Sort trades by date and type (Sells before Buys on same day)
  const sortedTrades = [...trades].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCompare !== 0) return dateCompare
    const typeOrder = { 'Sell': 0, 'Buy': 1, 'Reinvestment': 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })
  
  // Process each day
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Apply trades for this day
    const todaysTrades = sortedTrades.filter(t => t.date === dateStr)
    todaysTrades.forEach(trade => {
      const currentShares = currentHoldings.get(trade.code) || 0
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        currentHoldings.set(trade.code, currentShares + trade.qty)
      } else if (trade.type === 'Sell') {
        currentHoldings.set(trade.code, Math.max(0, currentShares - Math.abs(trade.qty)))
      }
    })
    
    // Snapshot holdings for this day
    dailyHoldings.set(dateStr, new Map(currentHoldings))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dailyHoldings
}

/**
 * Extract cash flows from trades
 */
function extractCashFlows(trades: TradeRecord[]): CashFlow[] {
  return trades.map(trade => {
    const amount = Math.abs(trade.value)
    return {
      date: trade.date,
      amount: trade.type === 'Sell' ? -amount : (trade.type === 'Buy' ? amount : 0),
      type: trade.type
    }
  }).filter(cf => cf.amount !== 0) // Exclude reinvestments (they don't change invested capital)
}

/**
 * Calculate portfolio value for a given date
 */
function calculatePortfolioValue(
  holdings: Map<string, number>,
  tickerPrices: Map<string, Map<string, number>>,
  exchangeRate: number,
  dateStr: string,
  trades: TradeRecord[]
): number {
  let value = 0
  
  holdings.forEach((shares, ticker) => {
    if (shares > 0) {
      const priceMap = tickerPrices.get(ticker)
      if (priceMap) {
        const price = getNearestPrice(dateStr, priceMap)
        if (price > 0) {
          const isUSD = trades.find(t => t.code === ticker)?.instrumentCurrency === 'USD'
          const valueNZD = isUSD ? shares * price * exchangeRate : shares * price
          value += valueNZD
        }
      }
    }
  })
  
  return value
}

/**
 * Calculate Time-Weighted Returns (TWR)
 * 
 * TWR eliminates the impact of cash flows by calculating returns for each sub-period
 * between cash flows, then linking them together.
 * 
 * Method:
 * 1. For each day, calculate the daily return: (EndValue - StartValue - CashFlow) / StartValue
 * 2. Link the returns: CumulativeReturn = (1 + R1) × (1 + R2) × ... × (1 + Rn) - 1
 * 
 * This gives the true performance of the portfolio, independent of when money was added.
 */
export function calculateDailyReturns(
  trades: TradeRecord[],
  tickerPrices: Map<string, Map<string, number>>,
  exchangeRates: Map<string, number>,
  spyPrices: Map<string, number>,
  startDate: Date,
  endDate: Date
): DailyPortfolioData[] {
  
  logger.info('Starting Time-Weighted Return (TWR) calculation...')
  
  // Calculate daily holdings
  const dailyHoldings = calculateDailyHoldings(trades, startDate, endDate)
  
  // Extract cash flows
  const cashFlows = extractCashFlows(trades)
  const cashFlowsByDate = new Map<string, number>()
  cashFlows.forEach(cf => {
    cashFlowsByDate.set(cf.date, (cashFlowsByDate.get(cf.date) || 0) + cf.amount)
  })
  
  logger.debug(`Total cash flow events: ${cashFlows.length}`)
  
  // Track values
  let previousPortfolioValue = 0
  let cumulativeInvested = 0
  let portfolioReturnMultiplier = 1.0 // Tracks (1 + R1) × (1 + R2) × ...
  
  // S&P 500 benchmark tracking
  let sp500Shares = 0
  let previousSp500Value = 0
  let sp500ReturnMultiplier = 1.0
  
  const portfolioHistory: DailyPortfolioData[] = []
  
  // Process each day
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const holdings = dailyHoldings.get(dateStr) || new Map()
    const exchangeRate = exchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
    
    // Get cash flow for this date (positive = buy, negative = sell)
    const dailyCashFlow = cashFlowsByDate.get(dateStr) || 0
    
    // Calculate portfolio value at end of day
    const portfolioValue = calculatePortfolioValue(
      holdings,
      tickerPrices,
      exchangeRate,
      dateStr,
      trades
    )
    
    // For S&P 500: buy/sell shares with cash flows at the price on that day
    const spyPrice = getNearestPrice(dateStr, spyPrices)
    if (dailyCashFlow !== 0 && spyPrice > 0) {
      const spyPriceNZD = spyPrice * exchangeRate
      const sharesToBuySell = dailyCashFlow / spyPriceNZD
      sp500Shares += sharesToBuySell
      
      logger.debug(`${dateStr}: Cash flow ${dailyCashFlow.toFixed(2)}, SPY shares ${sharesToBuySell.toFixed(4)}`)
    }
    
    // Calculate S&P 500 value
    const sp500Value = sp500Shares * spyPrice * exchangeRate
    
    // Calculate daily returns (Time-Weighted)
    // Daily return = (End Value - Start Value - Cash Flow) / Start Value
    if (previousPortfolioValue > 0) {
      const dailyReturn = (portfolioValue - previousPortfolioValue - dailyCashFlow) / previousPortfolioValue
      portfolioReturnMultiplier *= (1 + dailyReturn)
      
      // Log significant daily changes
      if (Math.abs(dailyReturn) > 0.05) {
        logger.debug(`${dateStr}: Large daily return ${(dailyReturn * 100).toFixed(2)}%`)
      }
    } else if (dailyCashFlow > 0) {
      // First investment - no return yet, just starting
      portfolioReturnMultiplier = 1.0
    }
    
    // Calculate S&P 500 daily returns
    if (previousSp500Value > 0) {
      const sp500DailyReturn = (sp500Value - previousSp500Value - dailyCashFlow) / previousSp500Value
      sp500ReturnMultiplier *= (1 + sp500DailyReturn)
    } else if (dailyCashFlow > 0) {
      sp500ReturnMultiplier = 1.0
    }
    
    // Update cumulative invested capital (for reference)
    cumulativeInvested += dailyCashFlow
    
    // Calculate cumulative returns as percentage
    const portfolioReturn = (portfolioReturnMultiplier - 1) * 100
    const sp500Return = (sp500ReturnMultiplier - 1) * 100
    
    // Save to history if we have data
    if (portfolioValue > 0 || cumulativeInvested > 0) {
      portfolioHistory.push({
        date: dateStr,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        portfolioReturn: Math.round(portfolioReturn * 100) / 100,
        sp500Value: Math.round(sp500Value * 100) / 100,
        sp500Return: Math.round(sp500Return * 100) / 100,
        cashFlows: Math.round(dailyCashFlow * 100) / 100,
        totalInvested: Math.round(cumulativeInvested * 100) / 100
      })
    }
    
    // Update for next iteration
    previousPortfolioValue = portfolioValue
    previousSp500Value = sp500Value
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  const finalData = portfolioHistory[portfolioHistory.length - 1]
  logger.info('Time-Weighted Return calculation complete', {
    dataPoints: portfolioHistory.length,
    totalInvested: finalData?.totalInvested?.toFixed(2),
    finalPortfolioValue: finalData?.portfolioValue?.toFixed(2),
    finalPortfolioReturn: finalData?.portfolioReturn?.toFixed(2) + '%',
    finalSP500Return: finalData?.sp500Return?.toFixed(2) + '%',
    outperformance: (finalData ? finalData.portfolioReturn - finalData.sp500Return : 0).toFixed(2) + '%'
  })
  
  return portfolioHistory
}