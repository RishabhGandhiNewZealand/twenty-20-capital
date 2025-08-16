import { NextRequest, NextResponse } from 'next/server'
import { executeInUserContext } from '@/lib/db-with-rls'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'
import { requireAuth, createAuthenticatedResponse } from '@/lib/auth'

// GET single trade by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    const tradeId = parseInt(params.id)
    
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }
    
    // Fetch trade with user context
    const trade = await executeInUserContext(user.id, async (sql) => {
      const results = await sql`
        SELECT 
          id,
          code,
          market_code,
          name,
          date,
          type,
          qty,
          price,
          instrument_currency,
          brokerage,
          brokerage_currency,
          exch_rate,
          value,
          deleted_flag,
          deleted_at,
          created_at,
          updated_at
        FROM application.trade_data
        WHERE id = ${tradeId}
          AND user_id = ${user.id}
        LIMIT 1
      `
      
      if (results.length === 0) {
        return null
      }
      
      const row = results[0]
      return {
        id: row.id,
        code: row.code,
        marketCode: row.market_code,
        name: row.name,
        date: row.date.toISOString().split('T')[0],
        type: row.type as 'Buy' | 'Sell' | 'Reinvestment',
        qty: parseFloat(row.qty),
        price: parseFloat(row.price),
        instrumentCurrency: row.instrument_currency,
        brokerage: parseFloat(row.brokerage),
        brokerageCurrency: row.brokerage_currency,
        exchRate: parseFloat(row.exch_rate),
        value: parseFloat(row.value),
        deleted_flag: row.deleted_flag || false,
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : undefined,
        created_at: row.created_at ? row.created_at.toISOString() : undefined,
        updated_at: row.updated_at ? row.updated_at.toISOString() : undefined
      }
    })
    
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      )
    }
    
    return createAuthenticatedResponse(trade)
    
  } catch (error) {
    logger.error(`Error fetching trade ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch trade', details: errorMessage },
      { status: 500 }
    )
  }
}

// PUT update single trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    const tradeId = parseInt(params.id)
    
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }
    
    const trade: TradeRecord = await request.json()
    
    // Update trade with user context
    const updated = await executeInUserContext(user.id, async (sql) => {
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
          deleted_at = ${trade.deleted_flag ? new Date().toISOString() : null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${tradeId}
          AND user_id = ${user.id}
        RETURNING id
      `
      
      return result.length > 0
    })
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      )
    }
    
    logger.info(`Updated trade ${tradeId} for user ${user.id}`)
    
    // Invalidate portfolio caches for this user
    const { invalidateUserPortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidateUserPortfolioCaches(user.id)
    logger.info(`Portfolio caches invalidated for user ${user.id} after trade update`)
    
    return createAuthenticatedResponse({ success: true, id: tradeId })
    
  } catch (error) {
    logger.error(`Error updating trade ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update trade', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE soft-delete single trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    const tradeId = parseInt(params.id)
    
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }
    
    // Soft delete trade with user context
    const deleted = await executeInUserContext(user.id, async (sql) => {
      const result = await sql`
        UPDATE application.trade_data
        SET 
          deleted_flag = TRUE,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${tradeId}
          AND user_id = ${user.id}
          AND (deleted_flag = FALSE OR deleted_flag IS NULL)
        RETURNING id
      `
      
      return result.length > 0
    })
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Trade not found, already deleted, or access denied' },
        { status: 404 }
      )
    }
    
    logger.info(`Soft-deleted trade ${tradeId} for user ${user.id}`)
    
    // Invalidate portfolio caches for this user
    const { invalidateUserPortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidateUserPortfolioCaches(user.id)
    logger.info(`Portfolio caches invalidated for user ${user.id} after trade deletion`)
    
    return createAuthenticatedResponse({ success: true, id: tradeId })
    
  } catch (error) {
    logger.error(`Error deleting trade ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete trade', details: errorMessage },
      { status: 500 }
    )
  }
}