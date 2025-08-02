import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import yahooFinance from 'yahoo-finance2'

interface EarningsInfo {
  symbol: string
  name: string
  nextEarningsDate?: Date | null
  expectedEPS?: number
  expectedRevenue?: number
  previousEarningsDate?: Date | null
  reportedEPS?: number
  reportedRevenue?: number
  previousExpectedEPS?: number
  previousExpectedRevenue?: number
  isInPortfolio: boolean
  wasInPortfolio: boolean
  currency: string
}

async function getEarningsForSymbol(symbol: string, name: string): Promise<EarningsInfo | null> {
  try {
    // Adjust symbol for Yahoo Finance
    let yahooSymbol = symbol
    if (symbol === 'MFT') {
      yahooSymbol = 'MFT.NZ'
    } else if (symbol === 'BRK.B') {
      yahooSymbol = 'BRK-B'
    } else if (symbol === 'BRK.A') {
      yahooSymbol = 'BRK-A'
    }

    logger.info(`Fetching earnings for ${symbol} (${yahooSymbol})`)

    // Try to get quote and calendar events
    const quote = await yahooFinance.quote(yahooSymbol)
    
    const result: EarningsInfo = {
      symbol,
      name: name || quote.longName || quote.shortName || symbol,
      isInPortfolio: false,
      wasInPortfolio: false,
      currency: 'USD'
    }

    // Get earnings date from quote
    if (quote.earningsTimestamp) {
      result.nextEarningsDate = new Date(quote.earningsTimestamp * 1000)
    }

    // Try to get more detailed earnings info
    try {
      const quoteSummary = await yahooFinance.quoteSummary(yahooSymbol, {
        modules: ['calendarEvents', 'earnings']
      })

      if (quoteSummary.calendarEvents?.earnings) {
        const earnings = quoteSummary.calendarEvents.earnings
        
        // Next earnings date
        if (earnings.earningsDate && earnings.earningsDate.length > 0) {
          result.nextEarningsDate = new Date(earnings.earningsDate[0] * 1000)
        }
        
        // Expected values
        if (earnings.earningsAverage) {
          result.expectedEPS = earnings.earningsAverage
        }
        if (earnings.revenueAverage) {
          result.expectedRevenue = earnings.revenueAverage
        }
      }

      // Get historical earnings
      if (quoteSummary.earnings?.earningsChart?.quarterly) {
        const quarters = quoteSummary.earnings.earningsChart.quarterly
        if (quarters.length > 0) {
          const lastQuarter = quarters[quarters.length - 1]
          
          // Estimate previous earnings date (usually 4-6 weeks after quarter end)
          if (lastQuarter.date) {
            const quarterEnd = new Date(lastQuarter.date)
            quarterEnd.setDate(quarterEnd.getDate() + 35)
            result.previousEarningsDate = quarterEnd
          }
          
          if (lastQuarter.actual) {
            result.reportedEPS = lastQuarter.actual
          }
          if (lastQuarter.estimate) {
            result.previousExpectedEPS = lastQuarter.estimate
          }
        }
      }

      // Get revenue data
      if (quoteSummary.earnings?.financialsChart?.quarterly) {
        const quarters = quoteSummary.earnings.financialsChart.quarterly
        if (quarters.length > 0) {
          const lastQuarter = quarters[quarters.length - 1]
          if (lastQuarter.revenue) {
            result.reportedRevenue = lastQuarter.revenue
          }
        }
      }
    } catch (summaryError) {
      logger.warn(`Could not get detailed earnings for ${symbol}:`, summaryError)
    }

    return result
  } catch (error) {
    logger.error(`Error fetching earnings for ${symbol}:`, error)
    return null
  }
}

export async function GET() {
  try {
    logger.info('Starting earnings data fetch...')
    
    // Get portfolio data
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    logger.info(`Found ${holdings.length} current holdings and ${exitedPositions.length} exited positions`)
    
    // Create a map to track all unique companies
    const companiesMap = new Map<string, {
      name: string
      isCurrentHolding: boolean
      wasExited: boolean
      currency: string
    }>()
    
    // Add current holdings
    holdings.forEach(holding => {
      companiesMap.set(holding.symbol, {
        name: holding.name,
        isCurrentHolding: true,
        wasExited: false,
        currency: holding.instrumentCurrency
      })
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      const existing = companiesMap.get(position.symbol)
      if (existing) {
        existing.wasExited = true
      } else {
        companiesMap.set(position.symbol, {
          name: position.name,
          isCurrentHolding: false,
          wasExited: true,
          currency: position.instrumentCurrency
        })
      }
    })
    
    const allSymbols = Array.from(companiesMap.keys())
    logger.info(`Processing ${allSymbols.length} unique symbols: ${allSymbols.join(', ')}`)
    
    // Fetch earnings data for each symbol
    const earningsPromises = allSymbols.map(async (symbol) => {
      const company = companiesMap.get(symbol)!
      const earningsData = await getEarningsForSymbol(symbol, company.name)
      
      if (earningsData) {
        earningsData.isInPortfolio = company.isCurrentHolding
        earningsData.wasInPortfolio = company.wasExited
        earningsData.currency = company.currency
      }
      
      return earningsData
    })
    
    const allEarningsData = await Promise.all(earningsPromises)
    const validEarningsData = allEarningsData.filter(data => data !== null) as EarningsInfo[]
    
    logger.info(`Successfully fetched earnings data for ${validEarningsData.length} companies`)
    
    // Get date range
    const today = new Date()
    const daysBefore = 45
    const daysAfter = 45
    
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysBefore)
    
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysAfter)
    
    // Filter for companies with earnings in range
    const earningsInRange = validEarningsData.filter(company => {
      const hasUpcomingEarnings = company.nextEarningsDate && 
        company.nextEarningsDate >= today && 
        company.nextEarningsDate <= endDate
        
      const hasRecentEarnings = company.previousEarningsDate && 
        company.previousEarningsDate >= startDate && 
        company.previousEarningsDate < today
        
      return hasUpcomingEarnings || hasRecentEarnings
    })
    
    logger.info(`Found ${earningsInRange.length} companies with earnings in date range`)
    
    // Sort by earnings date
    earningsInRange.sort((a, b) => {
      // Upcoming earnings first
      if (a.nextEarningsDate && !b.nextEarningsDate) return -1
      if (!a.nextEarningsDate && b.nextEarningsDate) return 1
      
      if (a.nextEarningsDate && b.nextEarningsDate) {
        return a.nextEarningsDate.getTime() - b.nextEarningsDate.getTime()
      }
      
      // Then recent earnings (most recent first)
      if (a.previousEarningsDate && b.previousEarningsDate) {
        return b.previousEarningsDate.getTime() - a.previousEarningsDate.getTime()
      }
      
      return 0
    })
    
    // Convert dates to ISO strings for JSON response
    const responseData = earningsInRange.map(company => ({
      ...company,
      nextEarningsDate: company.nextEarningsDate?.toISOString() || null,
      previousEarningsDate: company.previousEarningsDate?.toISOString() || null
    }))
    
    return NextResponse.json({
      earnings: responseData,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalCompanies: allSymbols.length,
      companiesWithData: validEarningsData.length,
      companiesInRange: earningsInRange.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error in earnings API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch earnings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}