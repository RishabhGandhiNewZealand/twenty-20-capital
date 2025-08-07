import { NextResponse } from 'next/server'
import { NewsCache } from '@/lib/news-cache'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const newsCache = NewsCache.getInstance()
    
    // Initialize cache if needed
    try {
      await newsCache.initialize()
    } catch (error) {
      logger.warn('Failed to initialize news cache for status check:', error)
    }
    
    // Get cache statistics
    const stats = await newsCache.getStats()
    
    return NextResponse.json({
      status: 'ok',
      cache: {
        type: 'two-tier',
        memoryCache: {
          duration: '1 hour',
          description: 'Caches entire news analysis response'
        },
        databaseCache: {
          duration: 'Based on date range',
          description: 'Caches individual company news analysis'
        }
      },
      database: {
        totalEntries: stats.totalEntries,
        uniqueCompanies: stats.uniqueCompanies,
        totalRequests: stats.totalRequests,
        avgRequestsPerEntry: stats.avgRequestsPerEntry,
        oldestEntry: stats.oldestEntry,
        newestEntry: stats.newestEntry
      }
    })
  } catch (error) {
    logger.error('Error getting news cache status:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to get cache status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}