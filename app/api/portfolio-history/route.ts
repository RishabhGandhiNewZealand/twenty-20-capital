import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedPortfolioHistory } from '@/lib/portfolio-cache-service'
import { guardAdminRoute } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      const history = await getCachedPortfolioHistory()
      return NextResponse.json({
        history,
        lastUpdated: new Date().toISOString(),
        cached: true
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    } catch (error) {
      logger.error('Error fetching portfolio history:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch portfolio history',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
}