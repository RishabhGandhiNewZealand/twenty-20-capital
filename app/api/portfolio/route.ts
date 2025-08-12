import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedPortfolioCurrentData } from '@/lib/portfolio-cache-service'

/**
 * GET /api/portfolio
 * 
 * Returns cached portfolio data with automatic cache busting:
 * - Time-based: Cache expires after 20 minutes
 * - Event-based: Cache is invalidated when trades are updated
 */
export async function GET() {
  try {
    logger.info('Fetching portfolio data from cache...')
    const startTime = Date.now()
    
    // Get cached portfolio data
    const data = await getCachedPortfolioCurrentData()
    
    const duration = Date.now() - startTime
    logger.info(`Portfolio data fetched in ${duration}ms`)
    
    return NextResponse.json({
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
    logger.error('Error fetching portfolio data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 