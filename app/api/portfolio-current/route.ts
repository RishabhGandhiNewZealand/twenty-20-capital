import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedPortfolioCurrentData } from '@/lib/portfolio-cache-service'

export async function GET() {
  try {
    const data = await getCachedPortfolioCurrentData()
    return NextResponse.json({
      holdings: data.holdings,
      exitedPositions: data.exitedPositions,
      summary: data.summary,
      lastUpdated: data.lastUpdated,
      cached: true
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    logger.error('Error fetching portfolio current data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
