import { NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

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

// Cache the compositions data for performance
let cachedCompositions: CompositionData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

export async function GET() {
  try {
    // Check if we have valid cached data
    if (cachedCompositions && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedCompositions)
    }

    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return NextResponse.json({})
    }
    
    // Sort trades by date
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Get date range
    const startDate = new Date(trades[0].date)
    const endDate = new Date()
    
    logger.info(`Processing compositions from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    // Get unique tickers
    const tickers = [...new Set(trades.map(t => t.code))]
    
    // For performance, we'll only calculate compositions for specific dates
    // (e.g., end of each month and the current date)
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
      
      // For simplicity, we'll use a placeholder value calculation
      // In a real implementation, you'd fetch historical prices
      const holdingsArray: HoldingAtDate[] = []
      let totalValue = 0
      
      holdings.forEach(holding => {
        // Simplified: use shares * 100 as placeholder value
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
    
    // Cache the result
    cachedCompositions = compositions
    cacheTimestamp = Date.now()
    
    return NextResponse.json(compositions)
    
  } catch (error) {
    logger.error('Error calculating portfolio compositions:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio compositions' },
      { status: 500 }
    )
  }
}