import { NextRequest, NextResponse } from 'next/server'
import { warmUpPortfolioCaches, registerPortfolioCacheRefreshCallbacks } from '@/lib/portfolio-cache-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/cache/warmup
 * 
 * Warm up caches by pre-fetching data
 * This is useful after deployments or cache clears
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-auth')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Cache warmup requested')
    const startTime = Date.now()
    
    // Register refresh callbacks if not already registered
    registerPortfolioCacheRefreshCallbacks()
    
    // Warm up portfolio caches
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
}