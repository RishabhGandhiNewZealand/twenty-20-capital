import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

// PUT update trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const tradeId = parseInt(params.id)
    const trade: TradeRecord = await request.json()
    
    // Always use user-specific database connection
    // Admin can only update their own trades, just like regular users
    const sql = getUserDb(userIdHeader)
    
    // Update trade - explicitly filter by user_id for security
    const result = await sql`
      UPDATE application.trade_data
      SET
        code = ${trade.code},
        market_code = ${trade.marketCode},
        name = ${trade.name},
        date = ${trade.date},
        type = ${trade.type},
        qty = ${trade.qty},
        price = ${trade.price},
        instrument_currency = ${trade.instrumentCurrency},
        brokerage = ${trade.brokerage},
        brokerage_currency = ${trade.brokerageCurrency},
        exch_rate = ${trade.exchRate},
        value = ${trade.value},
        deleted_flag = ${trade.deleted_flag || false},
        deleted_at = ${trade.deleted_flag ? new Date().toISOString() : null}
      WHERE id = ${tradeId}
        AND user_id = ${userIdHeader}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      )
    }
    
    logger.info(`Updated trade with ID: ${tradeId} for user ${userIdHeader}`)
    
    // Invalidate caches if admin (affects portfolio pages which show admin trades)
    if (isAdminHeader) {
      const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated after admin trade update')
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    logger.error('Error updating trade:', error)
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    )
  }
}

// DELETE soft delete trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const tradeId = parseInt(params.id)
    
    // Always use user-specific database connection
    // Admin can only delete their own trades, just like regular users
    const sql = getUserDb(userIdHeader)
    
    // Soft delete by setting deleted_flag and deleted_at
    // Explicitly filter by user_id for security
    const result = await sql`
      UPDATE application.trade_data
      SET
        deleted_flag = TRUE,
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${tradeId}
        AND user_id = ${userIdHeader}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      )
    }
    
    logger.info(`Soft deleted trade with ID: ${tradeId} for user ${userIdHeader}`)
    
    // Invalidate caches if admin (affects portfolio pages which show admin trades)
    if (isAdminHeader) {
      const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated after admin trade deletion')
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    logger.error('Error deleting trade:', error)
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    )
  }
}