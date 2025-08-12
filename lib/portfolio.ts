import { TradeRecord, PortfolioHolding, ExitedPosition } from '@/types/portfolio'

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
  
  // Debug: Log Uber trades
  const uberTrades = sortedTrades.filter(t => t.code === 'UBER')
  if (uberTrades.length > 0) {
    console.log('=== UBER TRADES DEBUG ===')
    uberTrades.forEach(t => {
      console.log(`Date: ${t.date}, Type: ${t.type}, Qty: ${t.qty}, Price: ${t.price}, Value: ${t.value}, ID: ${t.id}`)
    })
  }
  
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
  
  // Debug: Check Uber holding after processing
  const uberHolding = holdings.get('UBER')
  if (uberHolding) {
    console.log('=== UBER HOLDING AFTER PROCESSING ===')
    console.log(`Total Shares: ${uberHolding.totalShares}`)
    console.log(`Total Cost NZD: ${uberHolding.totalCostNZD}`)
    console.log(`Number of trades: ${uberHolding.trades.length}`)
  }
  
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