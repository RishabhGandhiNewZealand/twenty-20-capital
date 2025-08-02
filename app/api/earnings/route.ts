import { NextResponse } from 'next/server'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { logger } from '@/lib/logger'
import { getMultipleEarningsData, EarningsInfo } from '@/lib/earnings-data'

interface EarningsData extends EarningsInfo {
  isInPortfolio: boolean
  wasInPortfolio: boolean
  currency?: string
}

export async function GET() {
  try {
    // Get current and exited positions
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Get all unique symbols from current holdings and exited positions
    const currentSymbols = holdings.map(h => h.symbol)
    const exitedSymbols = exitedPositions.map(e => e.symbol)
    const allSymbols = [...new Set([...currentSymbols, ...exitedSymbols])]
    
    // Fetch real earnings data from Yahoo Finance
    const earningsMap = await getMultipleEarningsData(allSymbols)
    
    // Get current date
    const today = new Date()
    const daysBefore = 45
    const daysAfter = 45
    
    // Calculate date range
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysBefore)
    
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysAfter)
    
    // Filter earnings data for portfolio companies within date range
    const earningsData: EarningsData[] = []
    
    for (const [symbol, earnings] of earningsMap) {
      const nextEarningsDate = earnings.nextEarningsDate ? new Date(earnings.nextEarningsDate) : null
      const previousEarningsDate = earnings.previousEarningsDate ? new Date(earnings.previousEarningsDate) : null
      
      // Check if earnings fall within our date range
      const hasUpcomingEarnings = nextEarningsDate && nextEarningsDate >= today && nextEarningsDate <= endDate
      const hasRecentEarnings = previousEarningsDate && previousEarningsDate >= startDate && previousEarningsDate < today
      
      if (hasUpcomingEarnings || hasRecentEarnings) {
        const holding = holdings.find(h => h.symbol === symbol)
        const exitedPosition = exitedPositions.find(e => e.symbol === symbol)
        
        earningsData.push({
          ...earnings,
          isInPortfolio: !!holding,
          wasInPortfolio: !!exitedPosition,
          currency: holding?.instrumentCurrency || exitedPosition?.instrumentCurrency || 'USD',
        })
      }
    }
    
    // Sort by next earnings date (upcoming first) then by previous earnings date
    earningsData.sort((a, b) => {
      // First, prioritize items with upcoming earnings
      if (a.nextEarningsDate && !b.nextEarningsDate) return -1
      if (!a.nextEarningsDate && b.nextEarningsDate) return 1
      
      // If both have upcoming earnings, sort by date
      if (a.nextEarningsDate && b.nextEarningsDate) {
        return new Date(a.nextEarningsDate).getTime() - new Date(b.nextEarningsDate).getTime()
      }
      
      // If both have only previous earnings, sort by date (most recent first)
      if (a.previousEarningsDate && b.previousEarningsDate) {
        return new Date(b.previousEarningsDate).getTime() - new Date(a.previousEarningsDate).getTime()
      }
      
      return 0
    })
    
    return NextResponse.json({
      earnings: earningsData,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error fetching earnings data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}