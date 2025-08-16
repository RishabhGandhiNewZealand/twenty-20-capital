import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedUserPortfolioCurrentData } from '@/lib/portfolio-cache-service-user'
import { requireAuth, createAuthenticatedResponse } from '@/lib/auth'

/**
 * GET /api/portfolio-current
 * 
 * Returns cached current portfolio data for the authenticated user with automatic cache busting:
 * - Time-based: Cache expires after 20 minutes
 * - Event-based: Cache is invalidated when trades are updated
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    logger.info(`Fetching current portfolio data for user ${user.id} from cache...`)
    const startTime = Date.now()
    
    // Get cached portfolio data for the specific user
    const data = await getCachedUserPortfolioCurrentData(user.id)
    
    const duration = Date.now() - startTime
    logger.info(`Current portfolio data fetched for user ${user.id} in ${duration}ms`)
    
    return createAuthenticatedResponse({
      holdings: data.holdings,
      exitedPositions: data.exitedPositions,
      summary: data.summary,
      lastUpdated: data.lastUpdated,
      cached: true,
      cacheInfo: {
        fetchTime: duration
      }
    })
  } catch (error) {
    logger.error('Error fetching current portfolio data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch current portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}