import { NextRequest, NextResponse } from 'next/server'
import { invalidatePortfolioCaches } from '@/lib/portfolio-cache-service'
import cacheManager, { CacheKey } from '@/lib/cache-manager'
import { logger } from '@/lib/logger'

/**
 * POST /api/cache/bust
 * 
 * Manually bust cache for specific keys or all caches
 * 
 * Body:
 * - keys: Array of cache keys to bust (optional)
 * - all: Boolean to bust all caches (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email') || ''
    const adminEmail = process.env.ADMIN_EMAIL || ''
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { keys, all } = body
    
    logger.info('Manual cache bust requested', { keys, all })
    
    if (all) {
      await cacheManager.clear()
      logger.info('All caches cleared')
      
      return NextResponse.json({
        success: true,
        message: 'All caches cleared',
        timestamp: new Date().toISOString()
      })
    } else if (keys && Array.isArray(keys)) {
      await cacheManager.bust(keys)
      logger.info(`Specific cache keys busted: ${keys.join(', ')}`)
      
      return NextResponse.json({
        success: true,
        message: `Cache keys busted: ${keys.join(', ')}`,
        keys,
        timestamp: new Date().toISOString()
      })
    } else {
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated via manual bust')
      
      return NextResponse.json({
        success: true,
        message: 'Portfolio caches invalidated',
        keys: [
          CacheKey.PORTFOLIO_HISTORY,
          CacheKey.PORTFOLIO_CURRENT,
          CacheKey.PORTFOLIO_COMPOSITION,
          CacheKey.TRADE_DATA
        ],
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    logger.error('Error busting cache:', error)
    return NextResponse.json(
      { 
        error: 'Failed to bust cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}