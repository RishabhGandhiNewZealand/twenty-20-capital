import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'

export interface EarningsInfo {
  symbol: string
  name: string
  nextEarningsDate?: string
  expectedEPS?: number
  expectedRevenue?: number
  previousEarningsDate?: string
  reportedEPS?: number
  reportedRevenue?: number
  previousExpectedEPS?: number
  previousExpectedRevenue?: number
}

// Cache earnings data to avoid hitting rate limits
const earningsCache = new Map<string, { data: EarningsInfo, timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

export async function getEarningsData(symbol: string): Promise<EarningsInfo | null> {
  try {
    // Check cache first
    const cached = earningsCache.get(symbol)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    // Adjust symbol for special cases
    let yahooSymbol = symbol
    if (symbol === 'MFT') {
      yahooSymbol = 'MFT.NZ'
    } else if (symbol === 'BRK.B') {
      yahooSymbol = 'BRK-B'
    } else if (symbol === 'BRK.A') {
      yahooSymbol = 'BRK-A'
    }

    // Fetch quote info which includes earnings dates
    let quote, calendarEvents
    try {
      [quote, calendarEvents] = await Promise.all([
        yahooFinance.quote(yahooSymbol),
        yahooFinance.quoteSummary(yahooSymbol, { modules: ['calendarEvents', 'earnings', 'defaultKeyStatistics'] })
      ])
    } catch (error) {
      // If quoteSummary fails, try just the quote
      quote = await yahooFinance.quote(yahooSymbol)
      calendarEvents = null
    }

    const earningsData: EarningsInfo = {
      symbol,
      name: quote.longName || quote.shortName || symbol,
    }

    // Get earnings dates and estimates
    if (calendarEvents?.calendarEvents) {
      const earnings = calendarEvents.calendarEvents.earnings
      
      // Next earnings date
      if (earnings?.earningsDate && earnings.earningsDate.length > 0) {
        earningsData.nextEarningsDate = new Date(earnings.earningsDate[0] * 1000).toISOString().split('T')[0]
      }
      
      // Expected EPS and Revenue for next earnings
      if (earnings?.earningsAverage) {
        earningsData.expectedEPS = earnings.earningsAverage
      }
      if (earnings?.revenueAverage) {
        earningsData.expectedRevenue = earnings.revenueAverage
      }
    }

    // Get historical earnings data
    if (calendarEvents?.earnings?.earningsChart?.quarterly && calendarEvents.earnings.earningsChart.quarterly.length > 0) {
      const latestQuarter = calendarEvents.earnings.earningsChart.quarterly[calendarEvents.earnings.earningsChart.quarterly.length - 1]
      
      if (latestQuarter) {
        // Previous earnings date (estimate based on quarter end)
        if (latestQuarter.date) {
          const quarterEndDate = new Date(latestQuarter.date)
          // Earnings typically reported 4-6 weeks after quarter end
          quarterEndDate.setDate(quarterEndDate.getDate() + 35)
          earningsData.previousEarningsDate = quarterEndDate.toISOString().split('T')[0]
        }
        
        // Reported EPS and Revenue
        if (latestQuarter.actual) {
          earningsData.reportedEPS = latestQuarter.actual
        }
        if (latestQuarter.estimate) {
          earningsData.previousExpectedEPS = latestQuarter.estimate
        }
      }
    }

    // Get revenue data if available
    if (calendarEvents?.earnings?.financialsChart?.quarterly && calendarEvents.earnings.financialsChart.quarterly.length > 0) {
      const latestQuarterRevenue = calendarEvents.earnings.financialsChart.quarterly[calendarEvents.earnings.financialsChart.quarterly.length - 1]
      
      if (latestQuarterRevenue?.revenue) {
        earningsData.reportedRevenue = latestQuarterRevenue.revenue
      }
      if (latestQuarterRevenue?.earnings) {
        // Sometimes earnings are stored here instead
        if (!earningsData.reportedEPS) {
          earningsData.reportedEPS = latestQuarterRevenue.earnings
        }
      }
    }

    // Cache the result
    earningsCache.set(symbol, { data: earningsData, timestamp: Date.now() })
    
    return earningsData
  } catch (error) {
    logger.error(`Error fetching earnings data for ${symbol}:`, error)
    return null
  }
}

export async function getMultipleEarningsData(symbols: string[]): Promise<Map<string, EarningsInfo>> {
  const results = new Map<string, EarningsInfo>()
  
  // Process in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (symbol) => {
        const data = await getEarningsData(symbol)
        return { symbol, data }
      })
    )
    
    for (const { symbol, data } of batchResults) {
      if (data) {
        results.set(symbol, data)
      }
    }
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}