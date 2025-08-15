import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserDb, getUserIdFromStackUser, isAdminUser, getAdminUserId } from '@/lib/rls-auth'
import { generatePortfolioData } from '@/lib/portfolioServerData'

/**
 * GET /api/user-portfolio
 * 
 * Returns portfolio data for the authenticated user
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

    logger.info('Fetching user portfolio data', { 
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
      ORDER BY date DESC, id DESC
    `
    
    logger.info(`Fetched ${trades.length} trades for user ${userIdHeader}`)
    
    // Generate portfolio data from trades
    const portfolioData = await generatePortfolioData(trades)
    
    const duration = Date.now() - startTime
    logger.info(`User portfolio data generated in ${duration}ms`)
    
    return NextResponse.json({
      holdings: portfolioData.holdings,
      exitedPositions: portfolioData.exitedPositions,
      summary: portfolioData.summary,
      lastUpdated: new Date().toISOString(),
      userId: userIdHeader,
      tradeCount: trades.length,
      fetchTime: duration
    })
  } catch (error) {
    logger.error('Error fetching user portfolio data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}