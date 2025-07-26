import { TradeRecord, PortfolioHolding, ExitedPosition } from '@/types/portfolio'

export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add the last field
  result.push(current.trim())
  return result
}

export function parseCSVData(csvContent: string): TradeRecord[] {
  const lines = csvContent.trim().split('\n')
  const trades: TradeRecord[] = []
  
  // Skip header and last line (Total row)
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const fields = parseCSVLine(line)
    
    if (fields.length >= 12) {
      const trade: TradeRecord = {
        code: fields[0],
        marketCode: fields[1],
        name: fields[2],
        date: fields[3],
        type: fields[4] as 'Buy' | 'Sell' | 'Reinvestment',
        qty: parseFloat(fields[5]),
        price: parseFloat(fields[6]),
        instrumentCurrency: fields[7],
        brokerage: parseFloat(fields[8]),
        brokerageCurrency: fields[9],
        exchRate: parseFloat(fields[10]),
        value: parseFloat(fields[11].replace(/[",]/g, ''))
      }
      
      trades.push(trade)
    }
  }
  
  return trades
}

export function calculatePortfolioData(trades: TradeRecord[]): { holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] } {
  const holdings = new Map<string, {
    symbol: string
    name: string
    totalShares: number
    totalCostNZD: number
    totalCostUSD: number
    instrumentCurrency: string
    marketCode: string
    firstPurchaseDate: string
    trades: TradeRecord[]
  }>()
  
  // Sort trades by date to process chronologically
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Process each trade
  for (const trade of sortedTrades) {
    const key = trade.code
    
    if (!holdings.has(key)) {
      holdings.set(key, {
        symbol: trade.code,
        name: trade.name,
        totalShares: 0,
        totalCostNZD: 0,
        totalCostUSD: 0,
        instrumentCurrency: trade.instrumentCurrency,
        marketCode: trade.marketCode,
        firstPurchaseDate: trade.date,
        trades: []
      })
    }
    
    const holding = holdings.get(key)!
    holding.trades.push(trade)
    
    if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
      holding.totalShares += trade.qty
      
      // Calculate cost in NZD (trade.value is already in NZD based on exchange rate)
      const costNZD = Math.abs(trade.value)
      holding.totalCostNZD += costNZD
      
      // Calculate cost in USD for USD stocks
      if (trade.instrumentCurrency === 'USD') {
        const costUSD = trade.qty * trade.price
        holding.totalCostUSD += costUSD
      }
    } else if (trade.type === 'Sell') {
      // For sells, we need to reduce shares proportionally
      const sharesBeforeSale = holding.totalShares
      const sharesSold = Math.abs(trade.qty)
      const remainingShares = sharesBeforeSale - sharesSold
      
      if (remainingShares > 0) {
        // Proportionally reduce costs
        const remainingRatio = remainingShares / sharesBeforeSale
        holding.totalCostNZD *= remainingRatio
        holding.totalCostUSD *= remainingRatio
        holding.totalShares = remainingShares
      } else {
        // Sold all shares
        holding.totalShares = 0
        holding.totalCostNZD = 0
        holding.totalCostUSD = 0
      }
    }
  }
  
  // Convert to PortfolioHolding array and separate current vs exited positions
  const currentHoldings: PortfolioHolding[] = []
  const exitedPositions: ExitedPosition[] = []
  
  for (const [_, holding] of holdings) {
    if (holding.totalShares > 0.01) {
      const portfolioHolding: PortfolioHolding = {
        symbol: holding.symbol,
        name: holding.name,
        totalShares: holding.totalShares,
        avgPriceNZD: holding.totalCostNZD / holding.totalShares,
        avgPriceUSD: holding.instrumentCurrency === 'USD' ? holding.totalCostUSD / holding.totalShares : undefined,
        allocation: 0, // Will be calculated after we get current values
        instrumentCurrency: holding.instrumentCurrency,
        marketCode: holding.marketCode,
        firstPurchaseDate: holding.firstPurchaseDate
      }
      
      currentHoldings.push(portfolioHolding)
    } else {
      // This is a completely exited position
      const buyTrades = holding.trades.filter(t => t.type === 'Buy' || t.type === 'Reinvestment')
      const sellTrades = holding.trades.filter(t => t.type === 'Sell')
      
      if (buyTrades.length > 0 && sellTrades.length > 0) {
        const totalInvestedNZD = buyTrades.reduce((sum, t) => sum + Math.abs(t.value), 0)
        const totalReturnNZD = sellTrades.reduce((sum, t) => sum + Math.abs(t.value), 0)
        const profitLossNZD = totalReturnNZD - totalInvestedNZD
        const profitLossPercentage = (profitLossNZD / totalInvestedNZD) * 100
        
        const entryDate = buyTrades[0].date
        const exitDate = sellTrades[sellTrades.length - 1].date
        
        exitedPositions.push({
          symbol: holding.symbol,
          name: holding.name,
          instrumentCurrency: holding.instrumentCurrency,
          marketCode: holding.marketCode,
          entryDate,
          exitDate,
          totalInvestedNZD,
          totalReturnNZD,
          profitLossNZD,
          profitLossPercentage
        })
      }
    }
  }
  
  return { holdings: currentHoldings, exitedPositions }
}

// Keep the old function for backward compatibility
export function calculateCurrentHoldings(trades: TradeRecord[]): PortfolioHolding[] {
  return calculatePortfolioData(trades).holdings
}

export function calculatePortfolioAllocations(holdings: PortfolioHolding[]): PortfolioHolding[] {
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.currentValueNZD || 0), 0)
  
  return holdings.map(holding => ({
    ...holding,
    allocation: totalValue > 0 ? (holding.currentValueNZD || 0) / totalValue * 100 : 0
  }))
} 