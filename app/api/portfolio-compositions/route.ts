import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { logger } from '@/lib/logger'

interface HoldingAtDate {
  symbol: string
  name: string
  shares: number
  value: number
  percentage: number
  currency: string
}

interface CompositionData {
  [date: string]: HoldingAtDate[]
}

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 3600 // 1 hour
const CACHE_TAG = 'portfolio-compositions'

/**
 * Calculate portfolio compositions for historical dates
 * This is the raw calculation function that will be cached
 */
async function calculatePortfolioCompositions(): Promise<CompositionData> {
  try {
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found for portfolio compositions')
      return {}
    }
    
    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info(`Calculating portfolio compositions from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // For performance, calculate compositions for specific dates
    // (end of each month and the current date)
    const compositionDates: Date[] = []
    const currentDate = new Date(startDate)
    
    // Add end of each month
    while (currentDate <= endDate) {
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      if (lastDayOfMonth <= endDate) {
        compositionDates.push(new Date(lastDayOfMonth))
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Add today
    compositionDates.push(new Date())
    
    // Calculate compositions for selected dates
    const compositions: CompositionData = {}
    
    for (const date of compositionDates) {
      const dateStr = date.toISOString().split('T')[0]
      
      // Calculate holdings up to this date
      const holdings = new Map<string, {
        symbol: string
        name: string
        shares: number
        currency: string
      }>()
      
      // Process all trades up to this date
      const tradesUpToDate = trades.filter(t => new Date(t.date) <= date)
      
      for (const trade of tradesUpToDate) {
        const current = holdings.get(trade.code) || {
          symbol: trade.code,
          name: trade.name,
          shares: 0,
          currency: trade.instrumentCurrency
        }
        
        if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
          current.shares += trade.qty
        } else if (trade.type === 'Sell') {
          current.shares += trade.qty // qty is negative for sells
        }
        
        if (current.shares > 0.001) { // Small threshold to handle floating point
          holdings.set(trade.code, current)
        } else {
          holdings.delete(trade.code)
        }
      }
      
      // For now, use a simplified value calculation
      // In production, you would fetch historical prices
      const holdingsArray: HoldingAtDate[] = []
      let totalValue = 0
      
      holdings.forEach(holding => {
        // Simplified: use shares * 100 as placeholder value
        // TODO: Integrate with historical price data
        const value = holding.shares * 100
        totalValue += value
        
        holdingsArray.push({
          symbol: holding.symbol,
          name: holding.name,
          shares: holding.shares,
          value: value,
          percentage: 0,
          currency: holding.currency
        })
      })
      
      // Calculate percentages
      holdingsArray.forEach(holding => {
        holding.percentage = totalValue > 0 ? (holding.value / totalValue) * 100 : 0
      })
      
      // Sort by value
      holdingsArray.sort((a, b) => b.value - a.value)
      
      if (holdingsArray.length > 0) {
        compositions[dateStr] = holdingsArray
      }
    }
    
    logger.info(`Calculated compositions for ${Object.keys(compositions).length} dates`)
    return compositions
    
  } catch (error) {
    logger.error('Error calculating portfolio compositions:', error)
    throw error
  }
}

/**
 * Cached version of calculatePortfolioCompositions
 * This function will cache the results for the specified duration
 */
const getCachedPortfolioCompositions = unstable_cache(
  calculatePortfolioCompositions,
  [CACHE_TAG],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAG]
  }
)

export async function GET() {
  try {
    // Fetch cached portfolio compositions
    const compositions = await getCachedPortfolioCompositions()
    
    // Set cache headers for client-side caching
    return NextResponse.json(compositions, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
    
  } catch (error) {
    logger.error('Error in portfolio compositions endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio compositions' },
      { status: 500 }
    )
  }
}