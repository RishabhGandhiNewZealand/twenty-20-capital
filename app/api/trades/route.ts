import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'

// GET /api/trades - Fetch all trades including soft-deleted ones
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword || token !== adminPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sql = getDb()
    
    // Fetch all trades including soft-deleted ones for admin view
    const trades = await sql`
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
    
    // Transform database results to match frontend expectations
    const transformedTrades = trades.map(row => ({
      id: row.id,
      code: row.code,
      marketCode: row.market_code,
      name: row.name,
      date: row.date.toISOString().split('T')[0],
      type: row.type,
      qty: parseFloat(row.qty),
      price: parseFloat(row.price),
      instrumentCurrency: row.instrument_currency,
      brokerage: parseFloat(row.brokerage),
      brokerageCurrency: row.brokerage_currency,
      exchRate: parseFloat(row.exch_rate),
      value: parseFloat(row.value),
      deletedFlag: row.deleted_flag || false,
      deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }))
    
    logger.info(`Fetched ${transformedTrades.length} trades for admin view`)
    
    return NextResponse.json({ trades: transformedTrades })
    
  } catch (error) {
    logger.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword || token !== adminPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
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
        ${body.code},
        ${body.marketCode},
        ${body.name},
        ${body.date},
        ${body.type},
        ${body.qty},
        ${body.price},
        ${body.instrumentCurrency},
        ${body.brokerage},
        ${body.brokerageCurrency},
        ${body.exchRate},
        ${body.value}
      )
      RETURNING *
    `
    
    logger.info(`Created new trade with ID: ${result[0].id}`)
    
    return NextResponse.json({ 
      success: true, 
      trade: {
        id: result[0].id,
        ...body,
        deletedFlag: false,
        deletedAt: null,
        createdAt: result[0].created_at.toISOString(),
        updatedAt: result[0].updated_at.toISOString()
      }
    })
    
  } catch (error) {
    logger.error('Error creating trade:', error)
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    )
  }
}