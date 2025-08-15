import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserDb } from '@/lib/rls-auth'

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
        type,
        code,
        name,
        qty,
        price,
        brokerage as fees,
        instrument_currency as currency,
        exch_rate as exchRate,
        user_id
      FROM application.trade_data
      WHERE user_id = ${userIdHeader}
        AND deleted_flag = false
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
    
    // For now, return a simplified daily data structure
    // This would need to be enhanced with actual historical price data
    // and portfolio value calculations
    const dailyData = []
    let portfolioValue = 0
    let costBasis = 0
    
    // Group trades by date and calculate running totals
    const tradesByDate = new Map()
    for (const trade of trades) {
      const dateStr = new Date(trade.date).toISOString().split('T')[0]
      if (!tradesByDate.has(dateStr)) {
        tradesByDate.set(dateStr, [])
      }
      tradesByDate.get(dateStr).push(trade)
    }
    
    // Calculate portfolio value for each date
    for (const [date, dayTrades] of tradesByDate) {
      for (const trade of dayTrades) {
        const tradeValue = trade.qty * trade.price
        if (trade.type === 'Buy') {
          costBasis += tradeValue
          portfolioValue += tradeValue
        } else if (trade.type === 'Sell') {
          portfolioValue -= tradeValue
        }
      }
      
      // Add daily data point
      dailyData.push({
        date,
        portfolioValue,
        costBasis,
        sp500Value: costBasis // Simplified - would need actual S&P 500 calculation
      })
    }
    
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