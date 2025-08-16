import { NextRequest, NextResponse } from 'next/server'
import { executeInUserContext } from '@/lib/db-with-rls'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'
import { requireAuth, createAuthenticatedResponse } from '@/lib/auth'

// GET all trades for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    // Execute query with user context for RLS
    const trades = await executeInUserContext(user.id, async (sql) => {
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
          updated_at,
          user_id
        FROM application.trade_data
        WHERE user_id = ${user.id}
          AND (deleted_flag = false OR deleted_flag IS NULL)
        ORDER BY date DESC, id DESC
      `
      
      // Transform database results to match TradeRecord interface
      return results.map(row => ({
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
      }))
    })
    
    logger.info(`Fetched ${trades.length} trades for user ${user.id}`)
    return createAuthenticatedResponse(trades)
    
  } catch (error) {
    logger.error('Error fetching trades:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST new trade for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    const trade: TradeRecord = await request.json()
    
    // Execute insert with user context
    const result = await executeInUserContext(user.id, async (sql) => {
      const insertResult = await sql`
        INSERT INTO application.trade_data (
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
          user_id
        ) VALUES (
          ${trade.code},
          ${trade.marketCode},
          ${trade.name},
          ${trade.date},
          ${trade.type},
          ${trade.qty},
          ${trade.price},
          ${trade.instrumentCurrency},
          ${trade.brokerage},
          ${trade.brokerageCurrency},
          ${trade.exchRate},
          ${trade.value},
          ${user.id}
        )
        RETURNING id
      `
      return insertResult[0]
    })
    
    logger.info(`Created new trade with ID: ${result.id} for user ${user.id}`)
    
    // Invalidate portfolio caches for this user
    const { invalidateUserPortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidateUserPortfolioCaches(user.id)
    logger.info(`Portfolio caches invalidated for user ${user.id} after trade creation`)
    
    return createAuthenticatedResponse({ id: result.id, success: true })
    
  } catch (error) {
    logger.error('Error creating trade:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create trade', details: errorMessage },
      { status: 500 }
    )
  }
}