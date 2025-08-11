/**
 * TESTING/DEBUGGING API ROUTE
 * 
 * This endpoint is for testing and debugging purposes only.
 * It provides a comprehensive matrix of portfolio data to help verify
 * calculations, track capital flow, and debug issues with cost basis
 * and S&P 500 benchmark calculations.
 * 
 * NOT FOR PRODUCTION USE
 */

import { NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { logger } from '@/lib/logger'
import yahooFinance from 'yahoo-finance2'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

interface PortfolioMatrix {
  metadata: {
    generatedAt: string
    exchangeRate: number
    totalTrades: number
    uniqueSymbols: number
    dateRange: {
      start: string
      end: string
    }
  }
  trades: TradeMatrix[]
  holdings: HoldingMatrix[]
  performance: PerformanceMatrix
  capitalFlow: CapitalFlowMatrix
  dailySnapshots: DailySnapshot[]
}

interface TradeMatrix {
  date: string
  type: 'Buy' | 'Sell' | 'Reinvestment'
  symbol: string
  quantity: number
  price: number
  currency: string
  valueLocal: number
  valueNZD: number
  runningCostBasis: number
  runningCapitalPool: number
  isNewCapital: boolean
  newCapitalAmount: number
}

interface HoldingMatrix {
  symbol: string
  currentShares: number
  averageCost: number
  currentPrice: number
  currentValueNZD: number
  unrealizedGainNZD: number
  unrealizedGainPercent: number
  allocation: number
  firstPurchaseDate: string
  lastActivityDate: string
}

interface PerformanceMatrix {
  totalValueNZD: number
  totalCostBasisNZD: number
  totalRealizedGainsNZD: number
  totalUnrealizedGainsNZD: number
  totalGainsNZD: number
  totalGainsPercent: number
  sp500ValueNZD: number
  sp500GainsNZD: number
  sp500GainsPercent: number
  alphaVsSP500: number
}

interface CapitalFlowMatrix {
  totalInvested: number
  totalWithdrawn: number
  netCashFlow: number
  totalDividendsReinvested: number
  currentCapitalPool: number
  recycledCapital: number
}

interface DailySnapshot {
  date: string
  portfolioValueNZD: number
  costBasisNZD: number
  sp500ValueNZD: number
  dailyChangeNZD: number
  dailyChangePercent: number
}

async function getCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>()
  
  try {
    const promises = symbols.map(async (symbol) => {
      try {
        let yahooSymbol = symbol
        if (symbol === 'MFT') {
          yahooSymbol = 'MFT.NZ'
        }
        
        const quote = await yahooFinance.quote(yahooSymbol)
        if (quote && quote.regularMarketPrice) {
          priceMap.set(symbol, quote.regularMarketPrice)
        }
      } catch (error) {
        logger.error(`Failed to fetch price for ${symbol}:`, error)
        priceMap.set(symbol, 0)
      }
    })
    
    await Promise.all(promises)
  } catch (error) {
    logger.error('Error fetching current prices:', error)
  }
  
  return priceMap
}

async function getExchangeRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('NZDUSD=X')
    if (quote && quote.regularMarketPrice) {
      return 1 / quote.regularMarketPrice // Convert NZD/USD to USD/NZD
    }
  } catch (error) {
    logger.error('Failed to fetch exchange rate:', error)
  }
  return FALLBACK_USD_TO_NZD_RATE
}

export async function GET() {
  try {
    // Log that this is a testing endpoint being accessed
    logger.info('[TEST API] Generating portfolio matrix for debugging...')
    
    // Fetch trade data
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({
        error: 'No trade data available',
        matrix: null
      }, { status: 404 })
    }
    
    // Sort trades chronologically
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Get current exchange rate
    const currentExchangeRate = await getExchangeRate()
    
    // Get unique symbols
    const uniqueSymbols = [...new Set(trades.map(t => t.code))]
    
    // Get current prices
    const currentPrices = await getCurrentPrices(uniqueSymbols)
    
    // Initialize tracking variables
    let runningCostBasis = 0
    let runningCapitalPool = 0
    let totalRealizedGains = 0
    let totalDividendsReinvested = 0
    let totalWithdrawn = 0
    let sp500Shares = 0
    let sp500CostBasis = 0
    
    // Track holdings
    const holdings = new Map<string, {
      shares: number
      totalCost: number
      realizedGains: number
      firstPurchaseDate: string
      lastActivityDate: string
    }>()
    
    // Process trades to build the matrix
    const tradeMatrix: TradeMatrix[] = []
    
    for (const trade of trades) {
      const exchangeRate = trade.instrumentCurrency === 'USD' ? currentExchangeRate : 1
      const valueLocal = Math.abs(trade.qty * trade.price)
      const valueNZD = valueLocal * exchangeRate
      
      let isNewCapital = false
      let newCapitalAmount = 0
      
      // Initialize or update holding
      if (!holdings.has(trade.code)) {
        holdings.set(trade.code, {
          shares: 0,
          totalCost: 0,
          realizedGains: 0,
          firstPurchaseDate: trade.date,
          lastActivityDate: trade.date
        })
      }
      
      const holding = holdings.get(trade.code)!
      holding.lastActivityDate = trade.date
      
      if (trade.type === 'Buy') {
        // Determine if this is new capital or recycled
        if (runningCapitalPool >= valueNZD) {
          // Using recycled capital
          runningCapitalPool -= valueNZD
          isNewCapital = false
        } else {
          // Need new capital
          newCapitalAmount = valueNZD - runningCapitalPool
          runningCostBasis += newCapitalAmount
          runningCapitalPool = 0
          isNewCapital = true
          
          // Calculate S&P 500 equivalent purchase
          // Note: In production, you'd fetch actual SPY price for the trade date
          const spyPrice = 500 // Placeholder
          const spyPriceNZD = spyPrice * exchangeRate
          if (spyPriceNZD > 0) {
            sp500Shares += newCapitalAmount / spyPriceNZD
            sp500CostBasis += newCapitalAmount
          }
        }
        
        // Update holding
        holding.shares += trade.qty
        holding.totalCost += valueNZD
        
      } else if (trade.type === 'Sell') {
        // Add to capital pool
        runningCapitalPool += valueNZD
        totalWithdrawn += valueNZD
        
        // Calculate realized gains
        const avgCost = holding.totalCost / holding.shares
        const costOfSold = Math.abs(trade.qty) * avgCost
        const realizedGain = valueNZD - costOfSold
        totalRealizedGains += realizedGain
        holding.realizedGains += realizedGain
        
        // Update holding
        holding.shares += trade.qty // qty is negative for sells
        holding.totalCost -= costOfSold
        
      } else if (trade.type === 'Reinvestment') {
        // Track reinvested dividends
        totalDividendsReinvested += valueNZD
        holding.shares += trade.qty
        // Note: Reinvestments don't affect cost basis in our calculation
      }
      
      tradeMatrix.push({
        date: trade.date,
        type: trade.type,
        symbol: trade.code,
        quantity: trade.qty,
        price: trade.price,
        currency: trade.instrumentCurrency,
        valueLocal,
        valueNZD,
        runningCostBasis,
        runningCapitalPool,
        isNewCapital,
        newCapitalAmount
      })
    }
    
    // Calculate current holdings matrix
    const holdingMatrix: HoldingMatrix[] = []
    let totalCurrentValue = 0
    let totalUnrealizedGains = 0
    
    for (const [symbol, holding] of holdings) {
      if (holding.shares > 0) {
        const currentPrice = currentPrices.get(symbol) || 0
        const currency = trades.find(t => t.code === symbol)?.instrumentCurrency || 'NZD'
        const exchangeRate = currency === 'USD' ? currentExchangeRate : 1
        const currentValueNZD = holding.shares * currentPrice * exchangeRate
        const averageCost = holding.totalCost / holding.shares
        const unrealizedGainNZD = currentValueNZD - holding.totalCost
        const unrealizedGainPercent = holding.totalCost > 0 ? (unrealizedGainNZD / holding.totalCost) * 100 : 0
        
        totalCurrentValue += currentValueNZD
        totalUnrealizedGains += unrealizedGainNZD
        
        holdingMatrix.push({
          symbol,
          currentShares: holding.shares,
          averageCost,
          currentPrice,
          currentValueNZD,
          unrealizedGainNZD,
          unrealizedGainPercent,
          allocation: 0, // Will calculate after totals
          firstPurchaseDate: holding.firstPurchaseDate,
          lastActivityDate: holding.lastActivityDate
        })
      }
    }
    
    // Calculate allocations
    holdingMatrix.forEach(h => {
      h.allocation = totalCurrentValue > 0 ? (h.currentValueNZD / totalCurrentValue) * 100 : 0
    })
    
    // Sort holdings by allocation
    holdingMatrix.sort((a, b) => b.allocation - a.allocation)
    
    // Calculate S&P 500 current value (placeholder - in production, fetch actual SPY price)
    const currentSpyPrice = 520 // Placeholder
    const sp500ValueNZD = sp500Shares * currentSpyPrice * currentExchangeRate
    const sp500GainsNZD = sp500ValueNZD - sp500CostBasis
    const sp500GainsPercent = sp500CostBasis > 0 ? (sp500GainsNZD / sp500CostBasis) * 100 : 0
    
    // Calculate performance metrics
    const totalGainsNZD = totalRealizedGains + totalUnrealizedGains
    const totalGainsPercent = runningCostBasis > 0 ? (totalGainsNZD / runningCostBasis) * 100 : 0
    const alphaVsSP500 = totalGainsPercent - sp500GainsPercent
    
    const performanceMatrix: PerformanceMatrix = {
      totalValueNZD: totalCurrentValue,
      totalCostBasisNZD: runningCostBasis,
      totalRealizedGainsNZD: totalRealizedGains,
      totalUnrealizedGainsNZD: totalUnrealizedGains,
      totalGainsNZD,
      totalGainsPercent,
      sp500ValueNZD,
      sp500GainsNZD,
      sp500GainsPercent,
      alphaVsSP500
    }
    
    // Calculate capital flow metrics
    const capitalFlowMatrix: CapitalFlowMatrix = {
      totalInvested: runningCostBasis,
      totalWithdrawn,
      netCashFlow: runningCostBasis - totalWithdrawn,
      totalDividendsReinvested,
      currentCapitalPool: runningCapitalPool,
      recycledCapital: totalWithdrawn - runningCapitalPool
    }
    
    // Generate daily snapshots for the last 30 days (simplified)
    const dailySnapshots: DailySnapshot[] = []
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // For demonstration, we'll just create a few sample snapshots
    // In production, you'd calculate these from historical data
    for (let i = 0; i < 5; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i * 7)
      
      dailySnapshots.push({
        date: date.toISOString().split('T')[0],
        portfolioValueNZD: totalCurrentValue * (1 - i * 0.01), // Simplified
        costBasisNZD: runningCostBasis,
        sp500ValueNZD: sp500ValueNZD * (1 - i * 0.008), // Simplified
        dailyChangeNZD: i === 0 ? 0 : totalCurrentValue * 0.01,
        dailyChangePercent: i === 0 ? 0 : 1.0
      })
    }
    
    // Build the complete matrix
    const matrix: PortfolioMatrix = {
      metadata: {
        generatedAt: new Date().toISOString(),
        exchangeRate: currentExchangeRate,
        totalTrades: trades.length,
        uniqueSymbols: uniqueSymbols.length,
        dateRange: {
          start: trades[0].date,
          end: trades[trades.length - 1].date
        }
      },
      trades: tradeMatrix,
      holdings: holdingMatrix,
      performance: performanceMatrix,
      capitalFlow: capitalFlowMatrix,
      dailySnapshots
    }
    
    logger.info('[TEST API] Portfolio matrix generated successfully', {
      trades: matrix.trades.length,
      holdings: matrix.holdings.length,
      totalValue: matrix.performance.totalValueNZD.toFixed(2)
    })
    
    // Add warning that this is test data
    return NextResponse.json({
      success: true,
      warning: 'This is a testing/debugging endpoint. Not for production use.',
      matrix
    })
    
  } catch (error) {
    logger.error('Error generating portfolio matrix:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate portfolio matrix',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}