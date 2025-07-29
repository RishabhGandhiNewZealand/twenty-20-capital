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
        
        const earningsData: EarningsData = {
          symbol,
          name: data.name,
          nextEarningsDate: quote.earningsTimestamp ? new Date(quote.earningsTimestamp * 1000) : null,
          lastEarningsDate: null,
          estimatedEPS: calendarData?.earnings?.earningsChart?.quarterly?.[0]?.estimate,
          actualEPS: calendarData?.earnings?.earningsChart?.quarterly?.[0]?.actual,
          isActive: data.isActive
        }
        
        // If we have calendar events, use those dates
        if (calendarData?.calendarEvents?.earnings?.earningsDate) {
          earningsData.nextEarningsDate = new Date(calendarData.calendarEvents.earnings.earningsDate)
        }
        
        return earningsData
      } catch (error) {
        console.error(`Error fetching earnings for ${symbol}:`, error)
        return {
          symbol,
          name: data.name,
          nextEarningsDate: null,
          lastEarningsDate: null,
          isActive: data.isActive
        }
      }
    })
    
    const earningsResults = await Promise.all(earningsPromises)
    
    // Sort by next earnings date (null dates at the end)
    earningsResults.sort((a, b) => {
      if (!a.nextEarningsDate && !b.nextEarningsDate) return 0
      if (!a.nextEarningsDate) return 1
      if (!b.nextEarningsDate) return -1
      return a.nextEarningsDate.getTime() - b.nextEarningsDate.getTime()
    })
    
    return NextResponse.json({
      earnings: earningsResults,
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