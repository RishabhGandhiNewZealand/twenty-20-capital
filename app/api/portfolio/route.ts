import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { calculatePortfolioData } from '@/lib/portfolio'

/**
 * GET /api/portfolio - user-scoped current holdings and exited positions summary
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trades = await getCachedTradeData(userId)
    const { holdings, exitedPositions } = calculatePortfolioData(trades)

    const totalValue = holdings.reduce((sum, h) => sum + (isNaN(h.avgPriceNZD * h.totalShares) ? 0 : h.avgPriceNZD * h.totalShares), 0)
    const summary = {
      totalValueNZD: isNaN(totalValue) ? 0 : totalValue,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      holdings,
      exitedPositions,
      summary,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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