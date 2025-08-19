import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

// GET trades for the current user (including soft-deleted if requested)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sql = getUserDb(userId)
    
    const includeDeleted = request.nextUrl.searchParams.get('includeDeleted') === 'true'

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
        base_value,
        base_currency,
        user_id,
        deleted_flag,
        deleted_at,
        created_at,
        updated_at
      FROM application.trade_data
      WHERE user_id = ${userId}
        ${includeDeleted ? sql`` : sql`AND (deleted_flag = FALSE OR deleted_flag IS NULL)`}
      ORDER BY date DESC, id DESC
    `
    
    const trades: TradeRecord[] = results.map(row => ({
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
      baseValue: parseFloat(row.base_value),
      baseCurrency: row.base_currency,
      user_id: row.user_id,
      deleted_flag: row.deleted_flag || false,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
      updated_at: row.updated_at ? row.updated_at.toISOString() : undefined
    }))
    
    logger.info(`Fetched ${trades.length} trades for user ${userEmail}`)
    return NextResponse.json(trades, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error fetching trades:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST new trade for current user
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const trade: TradeRecord = await request.json()
    const sql = getUserDb(userId)
    
    const result = await sql`
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
        base_value,
        base_currency,
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
        ${trade.baseValue},
        ${trade.baseCurrency},
        ${userId}
      )
      RETURNING id
    `
    
    logger.info(`Created new trade with ID: ${result[0].id} for user ${userEmail}`)
    
    const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidatePortfolioCaches()
    logger.info('Portfolio caches invalidated after trade creation')
    
    return NextResponse.json({ id: result[0].id, success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error creating trade:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create trade', details: errorMessage },
      { status: 500 }
    )
  }
}