import { NextRequest, NextResponse } from 'next/server'
import { warmUpPortfolioCaches, registerPortfolioCacheRefreshCallbacks } from '@/lib/portfolio-cache-service'
import { logger } from '@/lib/logger'
import { guardAdminRoute } from '@/lib/admin-auth'

/**
 * POST /api/cache/warmup
 * 
 * Warm up caches by pre-fetching data
 * This is useful after deployments or cache clears
 */
export async function POST(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      logger.info('Cache warmup requested')
      const startTime = Date.now()
      
      registerPortfolioCacheRefreshCallbacks()
      await warmUpPortfolioCaches()
      
      const duration = Date.now() - startTime
      logger.info(`Cache warmup completed in ${duration}ms`)
      
      return NextResponse.json({
        success: true,
        message: 'Cache warmup completed',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      logger.error('Error warming up cache:', error)
      return NextResponse.json(
        { 
          error: 'Failed to warm up cache',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
}