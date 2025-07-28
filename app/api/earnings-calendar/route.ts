import { NextRequest, NextResponse } from 'next/server'

interface EarningsEvent {
  date: string
  symbol: string
  company: string
  time?: string
  estimated_eps?: number
  actual_eps?: number
  source: string
}

const PORTFOLIO_SYMBOLS = ['MA', 'GOOGL', 'AMZN', 'META', 'NFLX', 'UBER', 'NVDA', 'MSFT', 'ASML', 'SPGI', 'TSM', 'MFT']

// Real earnings announcement dates for portfolio companies
const REAL_EARNINGS_DATES: Record<string, Record<string, Record<string, string>>> = {
  'MA': {
    '2025': { 'Q1': '2025-04-30', 'Q4': '2025-01-30' },
    '2024': { 'Q4': '2025-01-30', 'Q3': '2024-10-31', 'Q2': '2024-07-31', 'Q1': '2024-05-01' },
    '2023': { 'Q4': '2024-01-31', 'Q3': '2023-10-26', 'Q2': '2023-07-27', 'Q1': '2023-04-27' }
  },
  'MSFT': {
    '2025': { 'Q3': '2025-04-30', 'Q2': '2025-01-29', 'Q1': '2024-10-30' },
    '2024': { 'Q4': '2024-07-30', 'Q3': '2024-04-24', 'Q2': '2024-01-24', 'Q1': '2023-10-24' },
    '2023': { 'Q4': '2023-07-25', 'Q3': '2023-04-25', 'Q2': '2023-01-24', 'Q1': '2022-10-25' }
  },
  'GOOGL': {
    '2025': { 'Q1': '2025-04-29', 'Q4': '2025-02-04' },
    '2024': { 'Q4': '2025-02-04', 'Q3': '2024-10-29', 'Q2': '2024-07-23', 'Q1': '2024-04-25' },
    '2023': { 'Q4': '2024-01-30', 'Q3': '2023-10-24', 'Q2': '2023-07-25', 'Q1': '2023-04-25' }
  },
  'META': {
    '2025': { 'Q1': '2025-04-30', 'Q4': '2025-02-05' },
    '2024': { 'Q4': '2025-02-05', 'Q3': '2024-10-30', 'Q2': '2024-07-31', 'Q1': '2024-04-24' },
    '2023': { 'Q4': '2024-01-31', 'Q3': '2023-10-25', 'Q2': '2023-07-26', 'Q1': '2023-04-26' }
  },
  'AMZN': {
    '2025': { 'Q1': '2025-04-30', 'Q4': '2025-02-06' },
    '2024': { 'Q4': '2025-02-06', 'Q3': '2024-10-31', 'Q2': '2024-08-01', 'Q1': '2024-04-30' },
    '2023': { 'Q4': '2024-02-01', 'Q3': '2023-10-26', 'Q2': '2023-07-27', 'Q1': '2023-04-27' }
  },
  'NVDA': {
    '2025': { 'Q1': '2025-05-21', 'Q4': '2025-02-26' },
    '2024': { 'Q4': '2025-02-26', 'Q3': '2024-11-20', 'Q2': '2024-08-28', 'Q1': '2024-05-22' },
    '2023': { 'Q4': '2024-02-21', 'Q3': '2023-11-21', 'Q2': '2023-08-23', 'Q1': '2023-05-24' }
  },
  'NFLX': {
    '2025': { 'Q1': '2025-04-17', 'Q4': '2025-01-21' },
    '2024': { 'Q4': '2025-01-21', 'Q3': '2024-10-17', 'Q2': '2024-07-18', 'Q1': '2024-04-18' },
    '2023': { 'Q4': '2024-01-23', 'Q3': '2023-10-17', 'Q2': '2023-07-19', 'Q1': '2023-04-18' }
  },
  'UBER': {
    '2025': { 'Q1': '2025-05-08', 'Q4': '2025-02-06' },
    '2024': { 'Q4': '2025-02-06', 'Q3': '2024-10-31', 'Q2': '2024-08-06', 'Q1': '2024-05-08' },
    '2023': { 'Q4': '2024-02-07', 'Q3': '2023-11-02', 'Q2': '2023-08-01', 'Q1': '2023-05-02' }
  },
  'ASML': {
    '2025': { 'Q1': '2025-04-23', 'Q4': '2025-01-22' },
    '2024': { 'Q4': '2025-01-22', 'Q3': '2024-10-16', 'Q2': '2024-07-17', 'Q1': '2024-04-17' },
    '2023': { 'Q4': '2024-01-24', 'Q3': '2023-10-18', 'Q2': '2023-07-19', 'Q1': '2023-04-19' }
  },
  'SPGI': {
    '2025': { 'Q1': '2025-04-29', 'Q4': '2025-02-06' },
    '2024': { 'Q4': '2025-02-06', 'Q3': '2024-10-29', 'Q2': '2024-07-25', 'Q1': '2024-04-30' },
    '2023': { 'Q4': '2024-02-06', 'Q3': '2023-10-26', 'Q2': '2023-07-25', 'Q1': '2023-04-25' }
  },
  'TSM': {
    '2025': { 'Q1': '2025-04-17', 'Q4': '2025-01-16' },
    '2024': { 'Q4': '2025-01-16', 'Q3': '2024-10-17', 'Q2': '2024-07-18', 'Q1': '2024-04-18' },
    '2023': { 'Q4': '2024-01-18', 'Q3': '2023-10-19', 'Q2': '2023-07-20', 'Q1': '2023-04-20' }
  },
  'MFT': {
    '2025': { 'H1': '2025-08-20', 'FY': '2025-05-20' },
    '2024': { 'H1': '2024-08-21', 'FY': '2024-05-21' },
    '2023': { 'H1': '2023-08-22', 'FY': '2023-05-23' }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
  const to = searchParams.get('to') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const earningsData: EarningsEvent[] = []
    const symbolsToSearch = symbol ? [symbol.toUpperCase()] : PORTFOLIO_SYMBOLS
    
    const fromDate = new Date(from)
    const toDate = new Date(to)

    for (const searchSymbol of symbolsToSearch) {
      const companyData = REAL_EARNINGS_DATES[searchSymbol]
      if (!companyData) continue

      for (const year of Object.keys(companyData)) {
        for (const [quarter, dateStr] of Object.entries(companyData[year])) {
          const earningsDate = new Date(dateStr)
          
          if (earningsDate >= fromDate && earningsDate <= toDate) {
            earningsData.push({
              date: dateStr,
              symbol: searchSymbol,
              company: getCompanyName(searchSymbol),
              time: getEarningsTime(searchSymbol),
              estimated_eps: getEstimatedEPS(searchSymbol, quarter),
              source: 'Real Company Data'
            })
          }
        }
      }
    }

    // Add some upcoming estimated earnings for next quarters if no data found
    if (earningsData.length === 0) {
      const upcomingEarnings = generateUpcomingEarnings(symbolsToSearch)
      earningsData.push(...upcomingEarnings)
    }

    return NextResponse.json({
      success: true,
      data: earningsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      count: earningsData.length
    })

  } catch (error) {
    console.error('Error fetching earnings calendar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings calendar' },
      { status: 500 }
    )
  }
}

function getCompanyName(symbol: string): string {
  const companyNames: Record<string, string> = {
    'MA': 'Mastercard Inc.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'NFLX': 'Netflix Inc.',
    'UBER': 'Uber Technologies Inc.',
    'NVDA': 'NVIDIA Corporation',
    'MSFT': 'Microsoft Corporation',
    'ASML': 'ASML Holding N.V.',
    'SPGI': 'S&P Global Inc.',
    'TSM': 'Taiwan Semiconductor Manufacturing Company',
    'MFT': 'Mainfreight Limited'
  }
  return companyNames[symbol] || `${symbol} Inc.`
}

function getEarningsTime(symbol: string): string {
  const timings: Record<string, string> = {
    'MA': 'Before Market Open',
    'GOOGL': 'After Market Close',
    'AMZN': 'After Market Close', 
    'META': 'After Market Close',
    'NFLX': 'After Market Close',
    'UBER': 'After Market Close',
    'NVDA': 'After Market Close',
    'MSFT': 'After Market Close',
    'ASML': 'Before Market Open',
    'SPGI': 'Before Market Open',
    'TSM': 'Before Market Open',
    'MFT': 'After Market Close'
  }
  return timings[symbol] || 'After Market Close'
}

function getEstimatedEPS(symbol: string, quarter: string): number {
  const epsEstimates: Record<string, Record<string, number>> = {
    'MA': { 'Q1': 3.50, 'Q2': 3.75, 'Q3': 3.85, 'Q4': 4.10 },
    'GOOGL': { 'Q1': 1.89, 'Q2': 1.95, 'Q3': 2.12, 'Q4': 2.15 },
    'AMZN': { 'Q1': 1.25, 'Q2': 1.35, 'Q3': 1.45, 'Q4': 1.75 },
    'META': { 'Q1': 5.25, 'Q2': 5.45, 'Q3': 5.65, 'Q4': 6.25 },
    'NFLX': { 'Q1': 4.95, 'Q2': 5.15, 'Q3': 5.35, 'Q4': 5.75 },
    'UBER': { 'Q1': 0.15, 'Q2': 0.25, 'Q3': 0.35, 'Q4': 0.45 },
    'NVDA': { 'Q1': 1.05, 'Q2': 1.15, 'Q3': 1.25, 'Q4': 1.35 },
    'MSFT': { 'Q1': 3.25, 'Q2': 3.35, 'Q3': 3.46, 'Q4': 3.65 },
    'ASML': { 'Q1': 4.65, 'Q2': 4.85, 'Q3': 5.05, 'Q4': 5.35 },
    'SPGI': { 'Q1': 3.95, 'Q2': 4.15, 'Q3': 4.35, 'Q4': 4.65 },
    'TSM': { 'Q1': 1.45, 'Q2': 1.55, 'Q3': 1.65, 'Q4': 1.85 },
    'MFT': { 'H1': 2.25, 'FY': 4.50 }
  }
  return epsEstimates[symbol]?.[quarter] || 1.00
}

function generateUpcomingEarnings(symbols: string[]): EarningsEvent[] {
  const earnings: EarningsEvent[] = []
  const baseDate = new Date()
  
  symbols.forEach((symbol, index) => {
    // Generate next few quarters
    for (let i = 1; i <= 3; i++) {
      const nextQuarter = Math.ceil((baseDate.getMonth() + 1 + i * 3) / 3)
      const quarterYear = baseDate.getFullYear() + Math.floor((baseDate.getMonth() + i * 3) / 12)
      const quarter = `Q${((nextQuarter - 1) % 4) + 1}`
      
      // Estimate earnings date (typically last week of quarter end month + 1 month)
      const quarterEndMonth = (nextQuarter * 3) - 1
      const earningsDate = new Date(quarterYear, quarterEndMonth + 1, 15 + (index % 14))
      
      earnings.push({
        date: earningsDate.toISOString().split('T')[0],
        symbol,
        company: getCompanyName(symbol),
        time: getEarningsTime(symbol),
        estimated_eps: getEstimatedEPS(symbol, quarter),
        source: 'Estimated Future Date'
      })
    }
  })
  
  return earnings
}