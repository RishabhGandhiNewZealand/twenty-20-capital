import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { generatePortfolioData } from '@/lib/portfolioServerData'

interface EarningsData {
  symbol: string
  name: string
  nextEarningsDate: Date | null
  lastEarningsDate: Date | null
  estimatedEPS?: number
  actualEPS?: number
  isActive: boolean // whether currently in portfolio
  hasReported?: boolean // whether earnings have already been reported
  daysUntilEarnings?: number // positive for future, negative for past
}

export async function GET() {
  try {
    // Get all portfolio companies (current and exited)
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Combine current holdings and exited positions to get all unique companies
    const allCompanies = new Map<string, { name: string, isActive: boolean }>()
    
    // Add current holdings
    holdings.forEach(holding => {
      allCompanies.set(holding.symbol, { name: holding.name, isActive: true })
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      if (!allCompanies.has(position.symbol)) {
        allCompanies.set(position.symbol, { name: position.name, isActive: false })
      }
    })
    
    // Fetch earnings data for each company
    const earningsPromises = Array.from(allCompanies.entries()).map(async ([symbol, data]) => {
      try {
        // Get quote data which includes earnings dates
        const quote = await yahooFinance.quote(symbol)
        
        // Get calendar data for more detailed earnings info
        let calendarData
        try {
          calendarData = await yahooFinance.quoteSummary(symbol, { modules: ['calendarEvents', 'earnings'] })
        } catch (error) {
          console.log(`Calendar data not available for ${symbol}`)
        }
        
        let earningsDate: Date | null = null
        
        // If we have calendar events, use those dates
        if (calendarData?.calendarEvents?.earnings?.earningsDate) {
          earningsDate = new Date(calendarData.calendarEvents.earnings.earningsDate)
        } else if (quote.earningsTimestamp) {
          earningsDate = new Date(quote.earningsTimestamp * 1000)
        }
        
        // Calculate days until earnings
        let daysUntilEarnings: number | undefined
        let hasReported = false
        
        if (earningsDate) {
          const now = new Date()
          const diffTime = earningsDate.getTime() - now.getTime()
          daysUntilEarnings = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          hasReported = daysUntilEarnings < 0
        }
        
        const earningsData: EarningsData = {
          symbol,
          name: data.name,
          nextEarningsDate: earningsDate,
          lastEarningsDate: hasReported ? earningsDate : null,
          estimatedEPS: calendarData?.earnings?.earningsChart?.quarterly?.[0]?.estimate,
          actualEPS: calendarData?.earnings?.earningsChart?.quarterly?.[0]?.actual,
          isActive: data.isActive,
          hasReported,
          daysUntilEarnings
        }
        
        return earningsData
      } catch (error) {
        console.error(`Error fetching earnings for ${symbol}:`, error)
        return {
          symbol,
          name: data.name,
          nextEarningsDate: null,
          lastEarningsDate: null,
          isActive: data.isActive,
          hasReported: false,
          daysUntilEarnings: undefined
        }
      }
    })
    
    const earningsResults = await Promise.all(earningsPromises)
    
    // Filter to only include companies with earnings within ±45 days
    const filteredResults = earningsResults.filter(e => {
      if (!e.daysUntilEarnings) return true // Include companies without earnings data
      return Math.abs(e.daysUntilEarnings) <= 45
    })
    
    // Sort by earnings date (past to future, null dates at the end)
    filteredResults.sort((a, b) => {
      if (!a.daysUntilEarnings && !b.daysUntilEarnings) return 0
      if (!a.daysUntilEarnings) return 1
      if (!b.daysUntilEarnings) return -1
      return a.daysUntilEarnings - b.daysUntilEarnings
    })
    
    return NextResponse.json({
      earnings: filteredResults,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in earnings API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}