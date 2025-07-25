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
  
  // Process each ticker separately - following Python logic exactly
  tickers.forEach(ticker => {
    const tickerTrades = trades.filter(trade => trade.code === ticker)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Initialize all dates with 0 holdings for this ticker
    dateRange.forEach(date => {
      dailyHoldings[formatDate(date)][ticker] = 0
    })
    
    // Process trades chronologically and update holdings from trade date forward
    tickerTrades.forEach(trade => {
      const tradeDate = new Date(trade.date)
      const tradeDateStr = formatDate(tradeDate)
      const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
      
      // Calculate net change for this trade
      let netChange = 0
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        netChange = qty
      } else if (trade.type === 'Sell') {
        // For sells, qty might be negative or positive, ensure we subtract
        netChange = qty < 0 ? qty : -qty
      }
      
      // Find the trade date index in our date range
      const tradeDateIndex = dateRange.findIndex(date => formatDate(date) === tradeDateStr)
      
      if (tradeDateIndex >= 0) {
        // Update holdings from this date forward (like Python's daily_holdings.loc[trade_date:, ticker])
        for (let i = tradeDateIndex; i < dateRange.length; i++) {
          const currentDateStr = formatDate(dateRange[i])
          dailyHoldings[currentDateStr][ticker] += netChange
        }
      }
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
            // Buy is fully covered by reinvested proceeds, no new capital
            soldCapitalAvailable -= tradeValueNZD
          } else {
            // Buy is partially or fully new capital
            const newCapitalInjected = tradeValueNZD - soldCapitalAvailable
            currentCostBasis += newCapitalInjected
            soldCapitalAvailable = 0 // Reset once exhausted
          }
        } else if (trade.type === 'Sell') {
          // Sell transactions add to reinvestable capital 
          // Note: sell qty is negative, so tradeValueNZD will be negative
          // We subtract the negative value (which adds the positive amount to available capital)
          soldCapitalAvailable -= tradeValueNZD  // This adds positive value since tradeValueNZD is negative
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

// Current price estimates based on actual current market data (July 2025)
function getCurrentPriceEstimates(): { [symbol: string]: number } {
  return {
    'META': 714.8,   // Meta current price
    'MA': 520,       // Mastercard (estimate) 
    'AMZN': 232.23,  // Amazon current price
    'NFLX': 1180.76, // Netflix current price
    'UBER': 90.87,   // Uber current price
    'GOOGL': 192.17, // Google current price
    'SPGI': 520,     // S&P Global (estimate)
    'ASML': 750,     // ASML (estimate)
    'MFT': 75        // Mainfreight (estimate, NZD)
  }
}

// Mock function to get historical prices (in a real app, this would call external APIs)
async function getHistoricalPrices(
  trades: TradeRecord[], 
  startDate: Date, 
  endDate: Date
): Promise<{ [symbol: string]: StockPriceData }> {
  const symbols = Array.from(new Set(trades.map(t => t.code)))
  const prices: { [symbol: string]: StockPriceData } = {}
  
  // Get current price estimates to anchor the simulation
  const currentPrices = getCurrentPriceEstimates()
  
  symbols.forEach(symbol => {
    prices[symbol] = {}
    const dateRange = generateDateRange(startDate, endDate)
    
    // Use current price as the end point and work backwards
    const currentPrice = currentPrices[symbol] || getAverageTradePrice(trades, symbol)
    const avgTradePrice = getAverageTradePrice(trades, symbol)
    
    dateRange.forEach((date, index) => {
      const dateStr = formatDate(date)
      const progress = index / (dateRange.length - 1) // 0 to 1
      
      // Interpolate from average trade price to current price with some volatility
      const basePrice = avgTradePrice + (currentPrice - avgTradePrice) * progress
      const volatility = 0.95 + Math.random() * 0.1 // +/- 5% random volatility
      prices[symbol][dateStr] = Math.max(basePrice * volatility, avgTradePrice * 0.5) // Never go below 50% of trade price
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