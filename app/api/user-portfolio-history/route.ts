import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserDb } from '@/lib/rls-auth'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'

/**
 * GET /api/user-portfolio-history
 * 
 * Returns portfolio history data for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const userEmailHeader = request.headers.get('x-user-email')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    logger.info('Fetching user portfolio history', { 
      userId: userIdHeader, 
      email: userEmailHeader,
      isAdmin: isAdminHeader 
    })
    
    const startTime = Date.now()
    
    // Get user-specific database connection
    const sql = getUserDb(userIdHeader)
    
    // Fetch user's trades
    const trades = await sql`
      SELECT 
        id,
        date,
        action,
        symbol,
        company,
        quantity,
        price,
        fees,
        currency,
        notes,
        user_id
      FROM application.trade_data
      WHERE user_id = ${userIdHeader}
        AND deleted = false
      ORDER BY date ASC
    `
    
    logger.info(`Fetched ${trades.length} trades for portfolio history`)
    
    if (trades.length === 0) {
      return NextResponse.json({
        dailyData: [],
        lastUpdated: new Date().toISOString(),
        userId: userIdHeader
      })
    }
    
    // Calculate daily returns for the user's portfolio
    const dailyData = await calculateDailyReturns(trades)
    
    const duration = Date.now() - startTime
    logger.info(`User portfolio history generated in ${duration}ms`)
    
    return NextResponse.json({
      dailyData,
      lastUpdated: new Date().toISOString(),
      userId: userIdHeader,
      fetchTime: duration
    })
  } catch (error) {
    logger.error('Error fetching user portfolio history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}