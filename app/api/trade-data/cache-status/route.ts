import { NextResponse } from 'next/server'
import { getTradeDataCacheStats } from '@/lib/trade-data-cache'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const stats = await getTradeDataCacheStats()
    
    return NextResponse.json({
      status: 'ok',
      cache: {
        revalidateSeconds: stats.cacheRevalidateSeconds,
        revalidateReadable: `${stats.cacheRevalidateSeconds / 60} minutes`
      },
      database: {
        totalTrades: stats.totalTrades,
        uniqueSymbols: stats.uniqueSymbols,
        earliestTrade: stats.earliestTrade,
        latestTrade: stats.latestTrade,
        lastUpdated: stats.lastUpdated
      }
    })
  } catch (error) {
    logger.error('Error getting cache status:', error)
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