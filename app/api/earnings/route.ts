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
          calendarData = await yahooFinance.quoteSummary(symbol, { modules: ['calendarEvents', 'earnings', 'defaultKeyStatistics'] })
        } catch (error) {
          console.log(`Calendar data not available for ${symbol}`)
        }
        
        let nextEarningsDate: Date | null = null
        let lastEarningsDate: Date | null = null
        let hasReported = false
        let daysUntilEarnings: number | undefined
        
        // Try to get next earnings date from multiple sources
        if (calendarData?.calendarEvents?.earnings?.earningsDate) {
          nextEarningsDate = new Date(calendarData.calendarEvents.earnings.earningsDate)
        } else if (quote.earningsTimestamp) {
          nextEarningsDate = new Date(quote.earningsTimestamp * 1000)
        }
        
        // Try to get last earnings date
        // First check if the earnings date is in the past
        if (nextEarningsDate) {
          const now = new Date()
          const diffTime = nextEarningsDate.getTime() - now.getTime()
          daysUntilEarnings = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (daysUntilEarnings < 0) {
            // The earnings date is in the past, so it's actually the last earnings
            lastEarningsDate = nextEarningsDate
            nextEarningsDate = null
            hasReported = true
          }
        }
        
        // Also check defaultKeyStatistics for most recent quarter
        if (!lastEarningsDate && calendarData?.defaultKeyStatistics?.mostRecentQuarter) {
          const recentQuarter = new Date(calendarData.defaultKeyStatistics.mostRecentQuarter)
          const now = new Date()
          const daysSinceQuarter = Math.ceil((now.getTime() - recentQuarter.getTime()) / (1000 * 60 * 60 * 24))
          
          // If the most recent quarter is within 45 days, use it as last earnings date
          if (daysSinceQuarter <= 45) {
            lastEarningsDate = recentQuarter
            hasReported = true
            daysUntilEarnings = -daysSinceQuarter
          }
        }
        
        // Get earnings estimates
        const quarterlyEarnings = calendarData?.earnings?.earningsChart?.quarterly
        const estimatedEPS = quarterlyEarnings?.[0]?.estimate
        const actualEPS = quarterlyEarnings?.[0]?.actual
        
        const earningsData: EarningsData = {
          symbol,
          name: data.name,
          nextEarningsDate,
          lastEarningsDate,
          estimatedEPS,
          actualEPS,
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
      // Include if no earnings data (we want to show these)
      if (!e.nextEarningsDate && !e.lastEarningsDate) return true
      
      // Include if has upcoming earnings within 45 days
      if (e.nextEarningsDate && e.daysUntilEarnings !== undefined && e.daysUntilEarnings <= 45) {
        return true
      }
      
      // Include if reported within last 45 days
      if (e.lastEarningsDate && e.daysUntilEarnings !== undefined && Math.abs(e.daysUntilEarnings) <= 45) {
        return true
      }
      
      return false
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