import { TradeRecord } from '@/types/portfolio'

export interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
}

export interface StockPriceData {
  [date: string]: number
}

export interface ExchangeRateData {
  [date: string]: number
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Helper function to parse date from string
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z')
}

// Generate date range from start to end
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Calculate daily holdings for each stock
export function calculateDailyHoldings(trades: TradeRecord[], startDate: Date, endDate: Date): { [date: string]: { [symbol: string]: number } } {
  const dateRange = generateDateRange(startDate, endDate)
  const dailyHoldings: { [date: string]: { [symbol: string]: number } } = {}
  
  // Initialize all dates with empty holdings
  dateRange.forEach(date => {
    dailyHoldings[formatDate(date)] = {}
  })
  
  // Get unique tickers
  const tickers = Array.from(new Set(trades.map(trade => trade.code)))
  
  // Process each ticker separately
  tickers.forEach(ticker => {
    const tickerTrades = trades.filter(trade => trade.code === ticker)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    let cumulativeHoldings = 0
    
    dateRange.forEach(date => {
      const dateStr = formatDate(date)
      
      // Process all trades for this ticker on this exact date
      const tradesOnDate = tickerTrades.filter(trade => {
        const tradeDate = new Date(trade.date)
        return formatDate(tradeDate) === dateStr
      })
      
      tradesOnDate.forEach(trade => {
        const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
        
        if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
          cumulativeHoldings += qty
        } else if (trade.type === 'Sell') {
          // For sells, qty might be negative or positive, ensure we subtract
          cumulativeHoldings += qty < 0 ? qty : -qty
        }
      })
      
      dailyHoldings[dateStr][ticker] = cumulativeHoldings
    })
  })
  
  return dailyHoldings
}

// Calculate daily portfolio values in NZD
export async function calculateDailyPortfolioValues(
  dailyHoldings: { [date: string]: { [symbol: string]: number } },
  trades: TradeRecord[],
  startDate: Date,
  endDate: Date
): Promise<{ [date: string]: number }> {
  const dailyValues: { [date: string]: number } = {}
  const dateRange = generateDateRange(startDate, endDate)
  
  // Get historical prices for all stocks (mock implementation)
  // In a real implementation, you'd fetch from yfinance or similar API
  const stockPrices = await getHistoricalPrices(trades, startDate, endDate)
  const exchangeRates = await getExchangeRates(startDate, endDate)
  
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    let totalValue = 0
    
    const holdings = dailyHoldings[dateStr]
    if (!holdings) return
    
    Object.entries(holdings).forEach(([symbol, shares]) => {
      if (shares === 0) return
      
      // Get currency for this stock
      const sampleTrade = trades.find(t => t.code === symbol)
      const currency = sampleTrade?.instrumentCurrency || 'USD'
      
      // Get price for this date (using closest available price)
      const price = getClosestPrice(stockPrices[symbol], dateStr)
      if (!price) return
      
      let valueNZD = shares * price
      
      // Convert USD to NZD if needed
      if (currency === 'USD') {
        const fxRate = getClosestExchangeRate(exchangeRates, dateStr)
        valueNZD *= fxRate
      }
      
      totalValue += valueNZD
    })
    
    dailyValues[dateStr] = totalValue
  })
  
  return dailyValues
}

// Calculate daily cost basis in NZD
export async function calculateDailyCostBasis(
  trades: TradeRecord[],
  startDate: Date,
  endDate: Date
): Promise<{ [date: string]: number }> {
  const dailyCostBasis: { [date: string]: number } = {}
  const dateRange = generateDateRange(startDate, endDate)
  
  let currentCostBasis = 0
  let soldCapitalAvailable = 0
  
  // Get exchange rates for USD conversion
  const exchangeRates = await getExchangeRates(startDate, endDate)
  
  // Sort trades by date
  const sortedTrades = trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  let tradeIndex = 0
  
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    
    // Process all trades on this date
    while (tradeIndex < sortedTrades.length) {
      const trade = sortedTrades[tradeIndex]
      const tradeDate = new Date(trade.date)
      
      if (tradeDate > date) {
        break // Future trade
      }
      
              if (formatDate(tradeDate) === dateStr) {
          const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
          const price = typeof trade.price === 'string' ? parseFloat(trade.price.replace(/[",]/g, '')) : trade.price
        
        // Get FX rate for trade date
        let fxRate = 1.0 // Default for NZD
        if (trade.instrumentCurrency === 'USD') {
          fxRate = getClosestExchangeRate(exchangeRates, dateStr) || 1.65 // Fallback rate
        }
        
        const tradeValueNZD = qty * price * fxRate
        
        if (trade.type === 'Buy') {
          if (soldCapitalAvailable >= tradeValueNZD) {
            // Buy is fully covered by reinvested proceeds
            soldCapitalAvailable -= tradeValueNZD
          } else {
            // Buy is partially or fully new capital
            const newCapitalInjected = tradeValueNZD - soldCapitalAvailable
            currentCostBasis += newCapitalInjected
            soldCapitalAvailable = 0
          }
                 } else if (trade.type === 'Sell') {
           // Sell transactions add to reinvestable capital 
           // Note: sell qty is typically negative, so tradeValueNZD will be negative
           // We want to add the absolute value to available capital
           soldCapitalAvailable += Math.abs(tradeValueNZD)
         }
        // Reinvestment doesn't affect cost basis
      }
      
      if (formatDate(tradeDate) <= dateStr) {
        tradeIndex++
      } else {
        break
      }
    }
    
    dailyCostBasis[dateStr] = currentCostBasis
  })
  
  return dailyCostBasis
}

// Mock function to get historical prices (in a real app, this would call external APIs)
async function getHistoricalPrices(
  trades: TradeRecord[], 
  startDate: Date, 
  endDate: Date
): Promise<{ [symbol: string]: StockPriceData }> {
  const symbols = Array.from(new Set(trades.map(t => t.code)))
  const prices: { [symbol: string]: StockPriceData } = {}
  
  // Mock price data - in reality you'd fetch from yfinance or similar
  symbols.forEach(symbol => {
    prices[symbol] = {}
    const dateRange = generateDateRange(startDate, endDate)
    
    // Use average price from trades as base, then simulate some growth
    const avgPrice = getAverageTradePrice(trades, symbol)
    
    dateRange.forEach((date, index) => {
      const dateStr = formatDate(date)
      // Simple simulation: base price with some growth and volatility
      const growth = 1 + (index / dateRange.length) * 0.3 // 30% growth over period
      const volatility = 0.95 + Math.random() * 0.1 // +/- 5% random volatility
      prices[symbol][dateStr] = avgPrice * growth * volatility
    })
  })
  
  return prices
}

// Mock function to get exchange rates
async function getExchangeRates(startDate: Date, endDate: Date): Promise<ExchangeRateData> {
  const exchangeRates: ExchangeRateData = {}
  const dateRange = generateDateRange(startDate, endDate)
  
  // Mock USD/NZD rate around 1.65 with some variation
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    exchangeRates[dateStr] = 1.6 + Math.random() * 0.1 // 1.6 to 1.7
  })
  
  return exchangeRates
}

// Helper functions
function getAverageTradePrice(trades: TradeRecord[], symbol: string): number {
  const symbolTrades = trades.filter(t => t.code === symbol && t.type === 'Buy')
  if (symbolTrades.length === 0) return 100 // Fallback
  
  const totalValue = symbolTrades.reduce((sum, trade) => {
    const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
    const price = typeof trade.price === 'string' ? parseFloat(trade.price.replace(/[",]/g, '')) : trade.price
    return sum + (qty * price)
  }, 0)
  
  const totalQty = symbolTrades.reduce((sum, trade) => {
    const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
    return sum + qty
  }, 0)
  
  return totalValue / totalQty
}

function getClosestPrice(prices: StockPriceData, dateStr: string): number | null {
  if (prices[dateStr]) return prices[dateStr]
  
  // Find closest previous date
  const dates = Object.keys(prices).sort()
  const targetDate = new Date(dateStr)
  
  for (let i = dates.length - 1; i >= 0; i--) {
    if (new Date(dates[i]) <= targetDate) {
      return prices[dates[i]]
    }
  }
  
  return null
}

function getClosestExchangeRate(rates: ExchangeRateData, dateStr: string): number {
  if (rates[dateStr]) return rates[dateStr]
  
  // Find closest previous date
  const dates = Object.keys(rates).sort()
  const targetDate = new Date(dateStr)
  
  for (let i = dates.length - 1; i >= 0; i--) {
    if (new Date(dates[i]) <= targetDate) {
      return rates[dates[i]]
    }
  }
  
  return 1.65 // Fallback rate
}

// Main function to calculate portfolio performance data
export async function calculatePortfolioPerformance(trades: TradeRecord[]): Promise<DailyPortfolioData[]> {
  if (trades.length === 0) return []
  
  // Determine date range
  const startDate = new Date(Math.min(...trades.map(t => new Date(t.date).getTime())))
  const endDate = new Date() // Today
  
  // Calculate daily holdings
  const dailyHoldings = calculateDailyHoldings(trades, startDate, endDate)
  
  // Calculate daily values and cost basis
  const [dailyValues, dailyCostBasis] = await Promise.all([
    calculateDailyPortfolioValues(dailyHoldings, trades, startDate, endDate),
    calculateDailyCostBasis(trades, startDate, endDate)
  ])
  
  // Combine into result array
  const result: DailyPortfolioData[] = []
  const dateRange = generateDateRange(startDate, endDate)
  
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    result.push({
      date: dateStr,
      portfolioValue: dailyValues[dateStr] || 0,
      costBasis: dailyCostBasis[dateStr] || 0
    })
  })
  
  return result
}