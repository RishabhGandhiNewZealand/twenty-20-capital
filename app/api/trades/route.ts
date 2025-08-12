import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

// GET all trades (including soft-deleted for admin view)
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-auth')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sql = getDb()
    
    // Fetch all trades including soft-deleted ones
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
      ORDER BY date DESC, id DESC
    `
    
    // Transform database results to match TradeRecord interface
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
      exchRate: parseFloat(row.exch_rate),
      value: parseFloat(row.value),
      deleted_flag: row.deleted_flag || false,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
      updated_at: row.updated_at ? row.updated_at.toISOString() : undefined
    }))
    
    logger.info(`Fetched ${trades.length} trades for admin view`)
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

// POST new trade
export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-auth')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const trade: TradeRecord = await request.json()
    const sql = getDb()
    
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
        exch_rate,
        value
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
        ${trade.value}
      )
      RETURNING id
    `
    
    logger.info(`Created new trade with ID: ${result[0].id}`)
    
    // Invalidate cache
    const { invalidateTradeDataCache } = await import('@/lib/trade-data-cache')
    await invalidateTradeDataCache()
    
    return NextResponse.json({ id: result[0].id, success: true })
    
  } catch (error) {
    logger.error('Error creating trade:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create trade', details: errorMessage },
      { status: 500 }
    )
  }
}