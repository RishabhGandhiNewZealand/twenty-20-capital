/**
 * Portfolio Calculations Module V2
 * 
 * This module implements money-weighted (time-weighted) return calculations
 * for accurate portfolio performance measurement with cash flows.
 * 
 * Key Concepts:
 * - Time-Weighted Return (TWR): Eliminates the impact of cash flows timing
 * - Money-Weighted Return: Accounts for the timing and size of cash flows
 * - We use a hybrid approach: track cumulative returns while properly handling cash flows
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
  portfolioReturn: number // Cumulative return % from inception
  sp500Value: number
  sp500Return: number // Cumulative return % from inception
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
  }).filter(cf => cf.amount !== 0) // Exclude reinvestments
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
 * Calculate money-weighted returns with proper cash flow handling
 * 
 * This uses a simple approach:
 * 1. Track portfolio value daily
 * 2. Track cash flows (buys/sells)
 * 3. Calculate returns as: (Current Value - Total Invested) / Total Invested
 * 4. For S&P 500, buy equivalent shares with each cash inflow
 * 
 * This gives a true money-weighted return that shows actual performance
 * accounting for when money was invested.
 */
export function calculateDailyReturns(
  trades: TradeRecord[],
  tickerPrices: Map<string, Map<string, number>>,
  exchangeRates: Map<string, number>,
  spyPrices: Map<string, number>,
  startDate: Date,
  endDate: Date
): DailyPortfolioData[] {
  
  logger.info('Starting money-weighted return calculation...')
  
  // Calculate daily holdings
  const dailyHoldings = calculateDailyHoldings(trades, startDate, endDate)
  
  // Extract cash flows
  const cashFlows = extractCashFlows(trades)
  const cashFlowsByDate = new Map<string, number>()
  cashFlows.forEach(cf => {
    cashFlowsByDate.set(cf.date, (cashFlowsByDate.get(cf.date) || 0) + cf.amount)
  })
  
  logger.debug(`Total cash flows: ${cashFlows.length}`)
  
  // Track cumulative invested capital
  let cumulativeInvested = 0
  
  // S&P 500 benchmark tracking - buy shares with each cash inflow
  let sp500Shares = 0
  
  const portfolioHistory: DailyPortfolioData[] = []
  
  // Process each day
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const holdings = dailyHoldings.get(dateStr) || new Map()
    const exchangeRate = exchangeRates.get(dateStr) || FALLBACK_USD_TO_NZD_RATE
    
    // Get cash flow for this date (positive = buy, negative = sell)
    const dailyCashFlow = cashFlowsByDate.get(dateStr) || 0
    
    // Update cumulative invested capital
    cumulativeInvested += dailyCashFlow
    
    // For S&P 500: buy/sell shares with cash flows
    if (dailyCashFlow !== 0) {
      const spyPrice = getNearestPrice(dateStr, spyPrices)
      if (spyPrice > 0) {
        const spyPriceNZD = spyPrice * exchangeRate
        const sharesToBuySell = dailyCashFlow / spyPriceNZD
        sp500Shares += sharesToBuySell
        
        logger.debug(`${dateStr}: Cash flow ${dailyCashFlow.toFixed(2)}, SPY shares ${sharesToBuySell.toFixed(4)}, total ${sp500Shares.toFixed(4)}`)
      }
    }
    
    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue(
      holdings,
      tickerPrices,
      exchangeRate,
      dateStr,
      trades
    )
    
    // Calculate S&P 500 value
    const spyPrice = getNearestPrice(dateStr, spyPrices)
    const sp500Value = sp500Shares * spyPrice * exchangeRate
    
    // Calculate returns as simple gain/loss percentage
    // Return = (Current Value - Total Invested) / Total Invested * 100
    const portfolioReturn = cumulativeInvested > 0 
      ? ((portfolioValue - cumulativeInvested) / cumulativeInvested) * 100
      : 0
    
    const sp500Return = cumulativeInvested > 0
      ? ((sp500Value - cumulativeInvested) / cumulativeInvested) * 100
      : 0
    
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
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  const finalData = portfolioHistory[portfolioHistory.length - 1]
  logger.info('Money-weighted return calculation complete', {
    dataPoints: portfolioHistory.length,
    totalInvested: finalData?.totalInvested?.toFixed(2),
    finalPortfolioValue: finalData?.portfolioValue?.toFixed(2),
    finalPortfolioReturn: finalData?.portfolioReturn?.toFixed(2) + '%',
    finalSP500Return: finalData?.sp500Return?.toFixed(2) + '%',
    outperformance: (finalData ? finalData.portfolioReturn - finalData.sp500Return : 0).toFixed(2) + '%'
  })
  
  return portfolioHistory
}