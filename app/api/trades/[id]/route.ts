import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

// PUT update trade (only if owned by user)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tradeId = parseInt(params.id)
    const trade: TradeRecord = await request.json()
    const sql = getUserDb(userId)
    
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
      WHERE id = ${tradeId} AND user_id = ${userId}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      )
    }
    
    logger.info(`Updated trade with ID: ${tradeId} for user ${userEmail}`)
    
    const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidatePortfolioCaches()
    logger.info('Portfolio caches invalidated after trade update')
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error updating trade:', error)
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    )
  }
}

// DELETE soft delete trade (only if owned by user)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tradeId = parseInt(params.id)
    const sql = getUserDb(userId)
    
    const result = await sql`
      UPDATE application.trade_data
      SET
        deleted_flag = TRUE,
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${tradeId} AND user_id = ${userId}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      )
    }
    
    logger.info(`Soft deleted trade with ID: ${tradeId} for user ${userEmail}`)
    
    const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidatePortfolioCaches()
    logger.info('Portfolio caches invalidated after trade deletion')
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error deleting trade:', error)
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    )
  }
}