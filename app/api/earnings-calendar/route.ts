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

// Free tier endpoints for earnings data
const FINANCIAL_MODELING_PREP_BASE = 'https://financialmodelingprep.com/api/v3'
const EOD_BASE = 'https://eodhd.com/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
  const to = searchParams.get('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const earningsData: EarningsEvent[] = []

    // Try Financial Modeling Prep (free tier allows limited requests)
    try {
      let fmpUrl = `${FINANCIAL_MODELING_PREP_BASE}/earning_calendar`
      if (symbol) {
        fmpUrl += `/${symbol}`
      }
      fmpUrl += `?from=${from}&to=${to}`

      const fmpResponse = await fetch(fmpUrl)
      if (fmpResponse.ok) {
        const fmpData = await fmpResponse.json()
        
        if (Array.isArray(fmpData)) {
          fmpData.forEach((event: any) => {
            earningsData.push({
              date: event.date,
              symbol: event.symbol,
              company: event.name || event.symbol,
              time: event.time,
              estimated_eps: event.epsEstimated,
              actual_eps: event.eps,
              source: 'Financial Modeling Prep'
            })
          })
        }
      }
    } catch (error) {
      console.log('FMP API not available:', error)
    }

    // Fallback to mock data for demonstration
    if (earningsData.length === 0) {
      const mockEarnings: EarningsEvent[] = [
        {
          date: new Date().toISOString().split('T')[0],
          symbol: 'AAPL',
          company: 'Apple Inc.',
          time: 'After Market Close',
          estimated_eps: 1.25,
          source: 'Demo Data'
        },
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          symbol: 'MSFT',
          company: 'Microsoft Corporation',
          time: 'Before Market Open',
          estimated_eps: 2.35,
          source: 'Demo Data'
        },
        {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          symbol: 'GOOGL',
          company: 'Alphabet Inc.',
          time: 'After Market Close',
          estimated_eps: 1.85,
          source: 'Demo Data'
        },
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          symbol: 'TSLA',
          company: 'Tesla, Inc.',
          time: 'After Market Close',
          estimated_eps: 0.95,
          source: 'Demo Data'
        },
        {
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          symbol: 'AMZN',
          company: 'Amazon.com, Inc.',
          time: 'After Market Close',
          estimated_eps: 0.75,
          source: 'Demo Data'
        }
      ]

      if (symbol) {
        earningsData.push(...mockEarnings.filter(e => e.symbol.toLowerCase() === symbol.toLowerCase()))
      } else {
        earningsData.push(...mockEarnings)
      }
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