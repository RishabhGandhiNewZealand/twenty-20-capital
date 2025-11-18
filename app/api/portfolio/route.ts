import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedPortfolioCurrentData } from '@/lib/portfolio-cache-service'
import { guardAdminRoute } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      const data = await getCachedPortfolioCurrentData()
      return NextResponse.json({
        holdings: data.holdings,
        exitedPositions: data.exitedPositions,
        summary: data.summary,
        lastUpdated: data.lastUpdated,
        cached: true
      })
    } catch (error) {
      logger.error('Error fetching portfolio data:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch portfolio data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
} 