import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedPortfolioHistory } from '@/lib/portfolio-cache-service'

/**
 * GET /api/portfolio-history
 * 
 * Returns cached portfolio history data with automatic cache busting:
 * - Time-based: Cache expires after 20 minutes
 * - Event-based: Cache is invalidated when trades are updated
 */
export async function GET() {
  try {
    logger.info('Fetching portfolio history from cache...')
    const startTime = Date.now()
    
    // Get cached portfolio history data
    const history = await getCachedPortfolioHistory()
    
    const duration = Date.now() - startTime
    logger.info(`Portfolio history fetched in ${duration}ms`)
    
    // Return the cached data
    return NextResponse.json({
      history,
      lastUpdated: new Date().toISOString(),
      cached: true,
      cacheInfo: {
        fetchTime: duration,
        dataPoints: history.length
      }
    })
    
  } catch (error) {
    logger.error('Error fetching portfolio history:', error)
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}