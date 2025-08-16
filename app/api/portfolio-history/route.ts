import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedUserPortfolioHistory } from '@/lib/portfolio-cache-service-user'
import { requireAuth, createAuthenticatedResponse } from '@/lib/auth'

/**
 * GET /api/portfolio-history
 * 
 * Returns cached portfolio history data for the authenticated user with automatic cache busting:
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
    
    logger.info(`Fetching portfolio history for user ${user.id} from cache...`)
    const startTime = Date.now()
    
    // Get cached portfolio history for the specific user
    const data = await getCachedUserPortfolioHistory(user.id)
    
    const duration = Date.now() - startTime
    logger.info(`Portfolio history fetched for user ${user.id} in ${duration}ms (${data.length} data points)`)
    
    return createAuthenticatedResponse({
      history: data,
      count: data.length,
      cached: true,
      cacheInfo: {
        fetchTime: duration
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
}