import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getEnhancedEarningsData } from '@/lib/earnings-data-enhanced'

export const dynamic = 'force-dynamic'

// Demo portfolio holdings
const DEMO_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'ASML', name: 'ASML Holding N.V.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' }
]

export async function GET() {
  try {
    const symbols = DEMO_HOLDINGS.map(h => h.symbol)
    const names = DEMO_HOLDINGS.map(h => h.name)
    
    logger.info('Fetching earnings data for demo portfolio...')
    
    const earningsData = await getEnhancedEarningsData(symbols, names)
    
    return NextResponse.json({
      ...earningsData,
      lastUpdated: new Date().toISOString(),
      demo: true
    })
  } catch (error) {
    logger.error('Error in demo earnings endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch earnings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}