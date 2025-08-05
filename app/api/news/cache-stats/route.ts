import { NextResponse } from 'next/server'
import { newsCache } from '@/lib/news-cache'
import { cleanupExpiredCache } from '@/lib/db-migrations'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Initialize cache
    await newsCache.initialize()
    
    // Get cache statistics
    const stats = await newsCache.getStats()
    
    if (!stats) {
      return NextResponse.json({
        message: 'Cache not configured or not available',
        cacheEnabled: false
      })
    }
    
    // Clean up expired entries
    const cleanedUp = await cleanupExpiredCache()
    
    return NextResponse.json({
      cacheEnabled: true,
      statistics: stats,
      cleanedUpEntries: cleanedUp,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    logger.error('Error getting cache stats:', error)
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}