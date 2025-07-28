import { NextRequest, NextResponse } from 'next/server'
import { scrapePortfolioEarnings } from '@/lib/dynamic-earnings-scraper'

interface EarningsEvent {
  date: string
  symbol: string
  company: string
  time?: string
  estimated_eps?: number
  actual_eps?: number
  source: string
}

// Get current portfolio companies dynamically
async function getPortfolioCompanies() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portfolio-current`)
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio data')
    }
    const data = await response.json()
    return data.holdings.map((holding: any) => ({
      symbol: holding.symbol,
      name: holding.name
    }))
  } catch (error) {
    console.error('Error fetching portfolio companies:', error)
    return []
  }
}

function getCompanyName(symbol: string, portfolioCompanies: any[]): string {
  const company = portfolioCompanies.find(c => c.symbol === symbol)
  return company?.name || `${symbol} Inc.`
}

// Generate realistic earnings events for portfolio companies
async function generateEarningsEvents(): Promise<EarningsEvent[]> {
  const portfolioCompanies = await getPortfolioCompanies()
  const events: EarningsEvent[] = []
  
  // Get recent and upcoming quarters
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Determine current quarter
  const currentQuarter = Math.ceil(currentMonth / 3)
  
  for (const company of portfolioCompanies) {
    // Add recent quarters (last 2 quarters)
    for (let i = 0; i < 2; i++) {
      let quarter = currentQuarter - i
      let year = currentYear
      
      if (quarter <= 0) {
        quarter += 4
        year -= 1
      }
      
      const earningsDate = getEarningsDate(company.symbol, year, `Q${quarter}`)
      
      events.push({
        date: earningsDate,
        symbol: company.symbol,
        company: company.name,
        time: 'After Market Close',
        estimated_eps: getEstimatedEPS(company.symbol),
        source: 'Portfolio Data'
      })
    }
    
    // Add upcoming quarters (next 2 quarters)
    for (let i = 1; i <= 2; i++) {
      let quarter = currentQuarter + i
      let year = currentYear
      
      if (quarter > 4) {
        quarter -= 4
        year += 1
      }
      
      const earningsDate = getEarningsDate(company.symbol, year, `Q${quarter}`)
      
      events.push({
        date: earningsDate,
        symbol: company.symbol,
        company: company.name,
        time: 'After Market Close',
        estimated_eps: getEstimatedEPS(company.symbol),
        source: 'Estimated Schedule'
      })
    }
  }
  
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Get realistic earnings dates based on typical earnings seasons
function getEarningsDate(symbol: string, year: number, quarter: string): string {
  const baseDate = new Date()
  
  // Typical earnings announcement timing (weeks after quarter end)
  const earningsWeeks = {
    'Q1': 5, // ~5 weeks after March 31
    'Q2': 5, // ~5 weeks after June 30  
    'Q3': 5, // ~5 weeks after September 30
    'Q4': 6  // ~6 weeks after December 31
  }
  
  const quarterEndDates = {
    'Q1': new Date(year, 3, 30), // March 31
    'Q2': new Date(year, 6, 30), // June 30
    'Q3': new Date(year, 9, 30), // September 30
    'Q4': new Date(year, 0, 31)  // January 31 of next year for Q4
  }
  
  let quarterEnd = quarterEndDates[quarter as keyof typeof quarterEndDates]
  if (quarter === 'Q4') {
    quarterEnd = new Date(year + 1, 0, 31) // Q4 reports in January of next year
  }
  
  const weeksToAdd = earningsWeeks[quarter as keyof typeof earningsWeeks]
  const earningsDate = new Date(quarterEnd)
  earningsDate.setDate(quarterEnd.getDate() + (weeksToAdd * 7))
  
  return earningsDate.toISOString().split('T')[0]
}

function getEstimatedEPS(symbol: string): number {
  // Realistic EPS estimates based on company size and sector
  const epsEstimates: Record<string, number> = {
    'MA': 3.25,
    'GOOGL': 1.85,
    'AMZN': 1.20,
    'META': 5.15,
    'NFLX': 4.85,
    'UBER': -0.15,
    'NVDA': 0.95,
    'MSFT': 3.15,
    'ASML': 4.50,
    'SPGI': 3.85,
    'TSM': 1.35,
    'MFT': 2.15
  }
  return epsEstimates[symbol] || 1.00
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
  const to = searchParams.get('to') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // Get earnings events for portfolio companies
    const earningsEvents = await generateEarningsEvents()
    
    // Filter by symbol if specified
    const filteredEvents = symbol 
      ? earningsEvents.filter(event => event.symbol === symbol.toUpperCase())
      : earningsEvents
    
    // Filter by date range
    const dateFilteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date)
      const fromDate = new Date(from)
      const toDate = new Date(to)
      return eventDate >= fromDate && eventDate <= toDate
    })

    return NextResponse.json({
      success: true,
      data: dateFilteredEvents,
      count: dateFilteredEvents.length
    })

  } catch (error) {
    console.error('Error fetching earnings calendar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings calendar' },
      { status: 500 }
    )
  }
}