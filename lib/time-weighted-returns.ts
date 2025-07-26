import { logger } from '@/lib/logger'

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

interface TimeWeightedReturn {
  date: string
  portfolioTWR: number
  sp500TWR: number
}

/**
 * Calculate time-weighted returns for portfolio and S&P 500
 * TWR = ((1 + r1) * (1 + r2) * ... * (1 + rn)) - 1
 * where r is the return for each sub-period between cash flows
 */
export function calculateTimeWeightedReturns(
  portfolioHistory: DailyPortfolioData[]
): TimeWeightedReturn[] {
  if (portfolioHistory.length < 2) {
    return []
  }

  const returns: TimeWeightedReturn[] = []
  
  // Find all cash flow dates (where cost basis changes)
  const cashFlowDates: number[] = [0] // Start with first date
  for (let i = 1; i < portfolioHistory.length; i++) {
    if (portfolioHistory[i].costBasis !== portfolioHistory[i - 1].costBasis) {
      cashFlowDates.push(i)
    }
  }
  cashFlowDates.push(portfolioHistory.length - 1) // End with last date
  
  // Calculate returns for each sub-period
  const subPeriodReturns: { portfolio: number; sp500: number }[] = []
  
  for (let i = 1; i < cashFlowDates.length; i++) {
    const startIdx = cashFlowDates[i - 1]
    const endIdx = i === cashFlowDates.length - 1 ? cashFlowDates[i] : cashFlowDates[i] - 1
    
    const startData = portfolioHistory[startIdx]
    const endData = portfolioHistory[endIdx]
    
    // Calculate sub-period returns
    const portfolioReturn = startData.portfolioValue > 0
      ? (endData.portfolioValue - startData.portfolioValue) / startData.portfolioValue
      : 0
    
    const sp500Return = startData.sp500Value > 0
      ? (endData.sp500Value - startData.sp500Value) / startData.sp500Value
      : 0
    
    subPeriodReturns.push({
      portfolio: portfolioReturn,
      sp500: sp500Return
    })
  }
  
  // Calculate cumulative TWR for each date
  let currentSubPeriod = 0
  let nextCashFlowIdx = 1
  
  for (let i = 0; i < portfolioHistory.length; i++) {
    // Check if we've moved to a new sub-period
    if (nextCashFlowIdx < cashFlowDates.length && i >= cashFlowDates[nextCashFlowIdx]) {
      currentSubPeriod++
      nextCashFlowIdx++
    }
    
    // Calculate cumulative TWR up to current sub-period
    let portfolioCumulativeTWR = 1
    let sp500CumulativeTWR = 1
    
    for (let j = 0; j <= currentSubPeriod && j < subPeriodReturns.length; j++) {
      portfolioCumulativeTWR *= (1 + subPeriodReturns[j].portfolio)
      sp500CumulativeTWR *= (1 + subPeriodReturns[j].sp500)
    }
    
    // If we're in the middle of a sub-period, calculate partial return
    if (currentSubPeriod < subPeriodReturns.length && 
        i > cashFlowDates[currentSubPeriod] && 
        i < (cashFlowDates[currentSubPeriod + 1] || portfolioHistory.length)) {
      
      const subPeriodStart = portfolioHistory[cashFlowDates[currentSubPeriod]]
      const current = portfolioHistory[i]
      
      const partialPortfolioReturn = subPeriodStart.portfolioValue > 0
        ? (current.portfolioValue - subPeriodStart.portfolioValue) / subPeriodStart.portfolioValue
        : 0
      
      const partialSp500Return = subPeriodStart.sp500Value > 0
        ? (current.sp500Value - subPeriodStart.sp500Value) / subPeriodStart.sp500Value
        : 0
      
      portfolioCumulativeTWR *= (1 + partialPortfolioReturn)
      sp500CumulativeTWR *= (1 + partialSp500Return)
    }
    
    // Convert to percentage
    const portfolioTWR = (portfolioCumulativeTWR - 1) * 100
    const sp500TWR = (sp500CumulativeTWR - 1) * 100
    
    returns.push({
      date: portfolioHistory[i].date,
      portfolioTWR,
      sp500TWR
    })
  }
  
  logger.debug('Calculated time-weighted returns', {
    dataPoints: returns.length,
    cashFlows: cashFlowDates.length - 2, // Exclude start and end
    finalPortfolioTWR: returns[returns.length - 1]?.portfolioTWR,
    finalSP500TWR: returns[returns.length - 1]?.sp500TWR
  })
  
  return returns
}

/**
 * Calculate annualized time-weighted returns
 */
export function calculateAnnualizedTWR(
  twr: number,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  
  if (years <= 0) return 0
  
  // Convert percentage to decimal for calculation
  const twrDecimal = twr / 100
  
  // Annualized return = (1 + total return)^(1/years) - 1
  const annualizedReturn = Math.pow(1 + twrDecimal, 1 / years) - 1
  
  return annualizedReturn * 100
}