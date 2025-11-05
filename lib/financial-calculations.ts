/**
 * Calculate Compound Annual Growth Rate (CAGR)
 * 
 * CAGR represents the mean annual growth rate of an investment over a specified period of time.
 * It assumes the investment compounds over time.
 * 
 * @param initialValue - Starting value of the investment (must be positive)
 * @param finalValue - Ending value of the investment
 * @param years - Number of years over which the growth occurred (must be positive)
 * @returns CAGR as a decimal (e.g., 0.15 for 15% annual growth)
 * 
 * @example
 * // Calculate CAGR for an investment that grew from $1000 to $2000 over 5 years
 * const cagr = calculateCAGR(1000, 2000, 5)
 * console.log(cagr) // 0.1487 (14.87% annual growth)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0
  return Math.pow(finalValue / initialValue, 1 / years) - 1
}

/**
 * Calculate CAGR from Total Return (e.g., TWR)
 * 
 * @param totalReturn - Total return as a decimal (e.g., 0.50 for 50% total return)
 * @param years - Number of years over which the return occurred
 * @returns CAGR as a decimal (e.g., 0.15 for 15% annual growth)
 * 
 * @example
 * // Calculate CAGR for a 50% total return over 2 years
 * const cagr = calculateCAGRFromTotalReturn(0.50, 2)
 * console.log(cagr) // 0.2247 (22.47% annual growth)
 */
export function calculateCAGRFromTotalReturn(totalReturn: number, years: number): number {
  if (years <= 0) return 0
  return Math.pow(1 + totalReturn, 1 / years) - 1
}

/**
 * Calculate CAGR from gain percentage
 * @param gainPercent Total gain percentage
 * @param years Number of years
 * @returns CAGR as a decimal
 */
export function calculateCAGRFromGainPercent(gainPercent: number, years: number): number {
  if (years <= 0) return 0
  const base = 1 + ((isNaN(gainPercent) ? 0 : gainPercent) / 100)
  return Math.pow(base, 1 / years) - 1
}

/**
 * Format percentage for display
 * @param value Decimal value (e.g., 0.15 for 15%)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const safe = isNaN(value) ? 0 : value
  const percentage = safe * 100
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(decimals)}%`
}

/**
 * Format currency value
 * @param value Numeric value
 * @param currency Currency code
 * @param locale Locale string
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'NZD', locale: string = 'en-NZ'): string {
  const safe = isNaN(value) ? 0 : value
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
}

/**
 * Calculate Time-Weighted Return (TWR) from daily portfolio history
 * TWR eliminates the impact of cash flows by calculating returns between cash flow events
 * and chaining them geometrically.
 * 
 * @param history Array of daily portfolio data with date, portfolioValue, and costBasis
 * @returns TWR as a decimal (e.g., 0.15 for 15% total return)
 */
export function calculateTimeWeightedReturn(
  history: Array<{ date: string; portfolioValue: number; costBasis: number }>
): number {
  if (history.length === 0) return 0
  
  // Sort by date to ensure chronological order
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Identify cash flow events (when costBasis changes)
  const periods: Array<{
    startDate: string
    endDate: string
    startValue: number
    endValue: number
    cashFlow: number
  }> = []
  
  let periodStartValue = sorted[0].portfolioValue
  let periodStartCostBasis = sorted[0].costBasis
  let periodStartDate = sorted[0].date
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = sorted[i - 1]
    
    // Detect cash flow event (cost basis changed)
    const cashFlow = current.costBasis - previous.costBasis
    
    if (Math.abs(cashFlow) > 0.01) {
      // End the current period just before the cash flow
      periods.push({
        startDate: periodStartDate,
        endDate: previous.date,
        startValue: periodStartValue,
        endValue: previous.portfolioValue,
        cashFlow: 0
      })
      
      // Start a new period after adjusting for cash flow
      // The new starting value is the previous ending value plus the cash flow
      periodStartValue = previous.portfolioValue + cashFlow
      periodStartCostBasis = current.costBasis
      periodStartDate = current.date
    }
    
    // If this is the last data point, close the final period
    if (i === sorted.length - 1) {
      periods.push({
        startDate: periodStartDate,
        endDate: current.date,
        startValue: periodStartValue,
        endValue: current.portfolioValue,
        cashFlow: 0
      })
    }
  }
  
  // If no cash flows detected, treat entire history as one period
  if (periods.length === 0) {
    const firstPoint = sorted[0]
    const lastPoint = sorted[sorted.length - 1]
    
    if (firstPoint.costBasis <= 0) return 0
    
    return (lastPoint.portfolioValue - firstPoint.costBasis) / firstPoint.costBasis
  }
  
  // Calculate period returns and chain them geometrically
  let cumulativeReturn = 1.0
  
  for (const period of periods) {
    if (period.startValue > 0) {
      const periodReturn = period.endValue / period.startValue
      cumulativeReturn *= periodReturn
    }
  }
  
  // Convert to total return (subtract 1 to get the return percentage)
  return cumulativeReturn - 1
}

/**
 * Calculate TWR-based performance data for charting
 * This calculates TWR up to each point in time
 * 
 * @param history Array of daily portfolio data
 * @returns Array with TWR performance at each date
 */
export function calculateTWRPerformanceData(
  history: Array<{ date: string; portfolioValue: number; costBasis: number; sp500Value: number }>
): Array<{ date: string; portfolioPerformance: number; sp500Performance: number }> {
  if (history.length === 0) return []
  
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const result: Array<{ date: string; portfolioPerformance: number; sp500Performance: number }> = []
  
  // Track cumulative TWR for portfolio
  let portfolioChainedReturn = 1.0
  let lastPortfolioValue = sorted[0].portfolioValue
  let lastCostBasis = sorted[0].costBasis
  
  // Track cumulative TWR for S&P 500
  let sp500ChainedReturn = 1.0
  let lastSP500Value = sorted[0].sp500Value
  let lastSP500CostBasis = sorted[0].costBasis
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    
    if (i > 0) {
      const previous = sorted[i - 1]
      
      // Detect cash flow for portfolio
      const cashFlow = current.costBasis - previous.costBasis
      
      if (Math.abs(cashFlow) > 0.01) {
        // Cash flow event - adjust base value
        // Calculate return up to this point
        if (lastPortfolioValue > 0) {
          const periodReturn = previous.portfolioValue / lastPortfolioValue
          portfolioChainedReturn *= periodReturn
        }
        
        // Reset base value after cash flow
        lastPortfolioValue = previous.portfolioValue + cashFlow
        lastCostBasis = current.costBasis
        
        // Do the same for S&P 500
        if (lastSP500Value > 0) {
          const sp500PeriodReturn = previous.sp500Value / lastSP500Value
          sp500ChainedReturn *= sp500PeriodReturn
        }
        lastSP500Value = previous.sp500Value + cashFlow
        lastSP500CostBasis = current.costBasis
      }
    }
    
    // Calculate current TWR as percentage
    const currentPortfolioReturn = lastPortfolioValue > 0 
      ? (portfolioChainedReturn * (current.portfolioValue / lastPortfolioValue) - 1) * 100
      : 0
    
    const currentSP500Return = lastSP500Value > 0
      ? (sp500ChainedReturn * (current.sp500Value / lastSP500Value) - 1) * 100
      : 0
    
    result.push({
      date: current.date,
      portfolioPerformance: isNaN(currentPortfolioReturn) ? 0 : currentPortfolioReturn,
      sp500Performance: isNaN(currentSP500Return) ? 0 : currentSP500Return
    })
  }
  
  return result
}