import { NextResponse } from 'next/server'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { logger } from '@/lib/logger'

// Mock earnings data - in production, this would come from a financial API
// like Alpha Vantage, Yahoo Finance, or Financial Modeling Prep
const mockEarningsData: Record<string, any> = {
  'AAPL': {
    nextEarningsDate: '2024-02-01',
    expectedEPS: 2.10,
    expectedRevenue: 117300000000,
    previousEarningsDate: '2023-11-02',
    reportedEPS: 1.46,
    reportedRevenue: 89500000000,
    previousExpectedEPS: 1.39,
    previousExpectedRevenue: 89300000000,
  },
  'MSFT': {
    nextEarningsDate: '2024-01-24',
    expectedEPS: 2.78,
    expectedRevenue: 61900000000,
    previousEarningsDate: '2023-10-24',
    reportedEPS: 2.99,
    reportedRevenue: 56500000000,
    previousExpectedEPS: 2.65,
    previousExpectedRevenue: 54700000000,
  },
  'GOOGL': {
    nextEarningsDate: '2024-01-30',
    expectedEPS: 1.64,
    expectedRevenue: 85300000000,
    previousEarningsDate: '2023-10-24',
    reportedEPS: 1.55,
    reportedRevenue: 76700000000,
    previousExpectedEPS: 1.45,
    previousExpectedRevenue: 75900000000,
  },
  'GOOG': {
    nextEarningsDate: '2024-01-30',
    expectedEPS: 1.64,
    expectedRevenue: 85300000000,
    previousEarningsDate: '2023-10-24',
    reportedEPS: 1.55,
    reportedRevenue: 76700000000,
    previousExpectedEPS: 1.45,
    previousExpectedRevenue: 75900000000,
  },
  'AMZN': {
    nextEarningsDate: '2024-02-01',
    expectedEPS: 0.83,
    expectedRevenue: 166000000000,
    previousEarningsDate: '2023-10-26',
    reportedEPS: 0.94,
    reportedRevenue: 143100000000,
    previousExpectedEPS: 0.58,
    previousExpectedRevenue: 141400000000,
  },
  'NVDA': {
    nextEarningsDate: '2024-02-21',
    expectedEPS: 4.56,
    expectedRevenue: 20400000000,
    previousEarningsDate: '2023-11-21',
    reportedEPS: 3.71,
    reportedRevenue: 18120000000,
    previousExpectedEPS: 3.36,
    previousExpectedRevenue: 16000000000,
  },
  'META': {
    nextEarningsDate: '2024-02-01',
    expectedEPS: 4.94,
    expectedRevenue: 39100000000,
    previousEarningsDate: '2023-10-25',
    reportedEPS: 4.39,
    reportedRevenue: 34150000000,
    previousExpectedEPS: 3.63,
    previousExpectedRevenue: 33560000000,
  },
  'TSLA': {
    nextEarningsDate: '2024-01-24',
    expectedEPS: 0.74,
    expectedRevenue: 25600000000,
    previousEarningsDate: '2023-10-18',
    reportedEPS: 0.66,
    reportedRevenue: 23350000000,
    previousExpectedEPS: 0.73,
    previousExpectedRevenue: 24380000000,
  },
  'BRK.B': {
    previousEarningsDate: '2023-11-04',
    reportedEPS: 10.32,
    reportedRevenue: 93210000000,
    previousExpectedEPS: 9.87,
    previousExpectedRevenue: 91500000000,
  },
  'JPM': {
    nextEarningsDate: '2024-01-12',
    expectedEPS: 3.32,
    expectedRevenue: 39800000000,
    previousEarningsDate: '2023-10-13',
    reportedEPS: 4.33,
    reportedRevenue: 40690000000,
    previousExpectedEPS: 3.90,
    previousExpectedRevenue: 39570000000,
  },
  'V': {
    nextEarningsDate: '2024-01-25',
    expectedEPS: 2.41,
    expectedRevenue: 8550000000,
    previousEarningsDate: '2023-10-24',
    reportedEPS: 2.19,
    reportedRevenue: 8070000000,
    previousExpectedEPS: 2.09,
    previousExpectedRevenue: 8050000000,
  },
  'WMT': {
    nextEarningsDate: '2024-02-20',
    expectedEPS: 1.65,
    expectedRevenue: 171000000000,
    previousEarningsDate: '2023-11-16',
    reportedEPS: 1.53,
    reportedRevenue: 160800000000,
    previousExpectedEPS: 1.52,
    previousExpectedRevenue: 159700000000,
  },
  'DIS': {
    nextEarningsDate: '2024-02-07',
    expectedEPS: 0.99,
    expectedRevenue: 23500000000,
    previousEarningsDate: '2023-11-08',
    reportedEPS: 0.82,
    reportedRevenue: 21240000000,
    previousExpectedEPS: 0.68,
    previousExpectedRevenue: 21370000000,
  },
  'NFLX': {
    previousEarningsDate: '2023-10-18',
    reportedEPS: 3.73,
    reportedRevenue: 8540000000,
    previousExpectedEPS: 3.49,
    previousExpectedRevenue: 8540000000,
  },
  'ADBE': {
    previousEarningsDate: '2023-12-13',
    reportedEPS: 4.27,
    reportedRevenue: 5050000000,
    previousExpectedEPS: 4.10,
    previousExpectedRevenue: 5010000000,
  },
  'CRM': {
    previousEarningsDate: '2023-11-29',
    reportedEPS: 2.11,
    reportedRevenue: 8720000000,
    previousExpectedEPS: 1.90,
    previousExpectedRevenue: 8630000000,
  },
  'PYPL': {
    nextEarningsDate: '2024-02-07',
    expectedEPS: 1.36,
    expectedRevenue: 8020000000,
    previousEarningsDate: '2023-11-01',
    reportedEPS: 1.30,
    reportedRevenue: 7420000000,
    previousExpectedEPS: 1.23,
    previousExpectedRevenue: 7380000000,
  },
  'COST': {
    previousEarningsDate: '2023-12-14',
    reportedEPS: 3.58,
    reportedRevenue: 57800000000,
    previousExpectedEPS: 3.42,
    previousExpectedRevenue: 57920000000,
  },
  'PEP': {
    nextEarningsDate: '2024-02-09',
    expectedEPS: 1.72,
    expectedRevenue: 28000000000,
    previousEarningsDate: '2023-10-10',
    reportedEPS: 2.24,
    reportedRevenue: 23450000000,
    previousExpectedEPS: 2.08,
    previousExpectedRevenue: 23040000000,
  },
  'TMO': {
    nextEarningsDate: '2024-01-31',
    expectedEPS: 5.15,
    expectedRevenue: 11200000000,
    previousEarningsDate: '2023-10-25',
    reportedEPS: 5.19,
    reportedRevenue: 10570000000,
    previousExpectedEPS: 4.73,
    previousExpectedRevenue: 10440000000,
  },
}

interface EarningsData {
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
  isInPortfolio: boolean
  wasInPortfolio: boolean
}

export async function GET() {
  try {
    // Get current and exited positions
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Get all unique symbols from current holdings and exited positions
    const currentSymbols = holdings.map(h => h.symbol)
    const exitedSymbols = exitedPositions.map(e => e.symbol)
    const allSymbols = [...new Set([...currentSymbols, ...exitedSymbols])]
    
    // Get current date
    const today = new Date()
    const daysBefore = 45
    const daysAfter = 45
    
    // Update mock data dates to be relative to today for demo purposes
    const updateDatesToRelative = (earnings: any) => {
      const result = { ...earnings }
      
      // If has next earnings date, set it to be within next 45 days
      if (earnings.nextEarningsDate) {
        const daysUntilEarnings = Math.floor(Math.random() * 40) + 5
        const nextDate = new Date(today)
        nextDate.setDate(today.getDate() + daysUntilEarnings)
        result.nextEarningsDate = nextDate.toISOString().split('T')[0]
      }
      
      // If has previous earnings date, set it to be within past 45 days
      if (earnings.previousEarningsDate) {
        const daysSinceEarnings = Math.floor(Math.random() * 40) + 5
        const prevDate = new Date(today)
        prevDate.setDate(today.getDate() - daysSinceEarnings)
        result.previousEarningsDate = prevDate.toISOString().split('T')[0]
      }
      
      return result
    }
    
    // Calculate date range
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysBefore)
    
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysAfter)
    
    // Filter earnings data for portfolio companies within date range
    const earningsData: EarningsData[] = []
    
    for (const symbol of allSymbols) {
      const earnings = mockEarningsData[symbol]
      if (!earnings) continue
      
      // Update dates to be relative to today for demo
      const updatedEarnings = updateDatesToRelative(earnings)
      
      const nextEarningsDate = updatedEarnings.nextEarningsDate ? new Date(updatedEarnings.nextEarningsDate) : null
      const previousEarningsDate = updatedEarnings.previousEarningsDate ? new Date(updatedEarnings.previousEarningsDate) : null
      
      // Check if earnings fall within our date range
      const hasUpcomingEarnings = nextEarningsDate && nextEarningsDate >= today && nextEarningsDate <= endDate
      const hasRecentEarnings = previousEarningsDate && previousEarningsDate >= startDate && previousEarningsDate < today
      
      if (hasUpcomingEarnings || hasRecentEarnings) {
        const holding = holdings.find(h => h.symbol === symbol)
        const exitedPosition = exitedPositions.find(e => e.symbol === symbol)
        
        earningsData.push({
          symbol,
          name: holding?.name || exitedPosition?.name || symbol,
          ...updatedEarnings,
          isInPortfolio: !!holding,
          wasInPortfolio: !!exitedPosition,
        })
      }
    }
    
    // Sort by next earnings date (upcoming first) then by previous earnings date
    earningsData.sort((a, b) => {
      if (a.nextEarningsDate && b.nextEarningsDate) {
        return new Date(a.nextEarningsDate).getTime() - new Date(b.nextEarningsDate).getTime()
      }
      if (a.nextEarningsDate) return -1
      if (b.nextEarningsDate) return 1
      
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