import { NextRequest, NextResponse } from 'next/server'
import cacheManager from '@/lib/cache-manager'
import { logger } from '@/lib/logger'
import { guardAdminRoute } from '@/lib/admin-auth'

/**
 * GET /api/cache/stats
 * 
 * Returns cache statistics for monitoring and debugging
 */
export async function GET(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      logger.info('Fetching cache statistics...')
      
      // Get cache statistics
      const stats = cacheManager.getStats()
      
      // Add additional metadata
      const enhancedStats = {
        ...stats,
        timestamp: new Date().toISOString(),
        cacheEnabled: true,
        cacheType: 'node-cache',
        ttlSeconds: 1200, // 20 minutes
        hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0
      }
      
      logger.info('Cache statistics retrieved', {
        keys: stats.keys,
        hitRate: enhancedStats.hitRate.toFixed(2) + '%'
      })
      
      return NextResponse.json(enhancedStats)
      
    } catch (error) {
      logger.error('Error fetching cache statistics:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch cache statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
}