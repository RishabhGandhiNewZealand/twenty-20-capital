import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserDb, getUserIdFromStackUser, isAdminUser } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'
import { cookies } from 'next/headers'

// Helper to get user from Stack session
async function getUserFromSession() {
  try {
    // Get the Stack session from cookies
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('stack-session')
    
    if (!sessionCookie) {
      return null
    }
    
    // Parse the session to get user info
    // Note: In production, you should verify this with Stack's API
    const sessionData = JSON.parse(sessionCookie.value)
    return sessionData.user || null
  } catch (error) {
    logger.error('Error getting user from session:', error)
    return null
  }
}

// GET all trades for the authenticated user (including admin)
export async function GET(request: NextRequest) {
  try {
    // Check for user authentication header (sent from client)
    const userIdHeader = request.headers.get('x-user-id')
    const userEmailHeader = request.headers.get('x-user-email')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }
    
    // Always use user-specific database connection
    // Admin will only see their own trades, just like regular users
    const sql = getUserDb(userIdHeader)
    
    // Fetch trades - RLS will automatically filter based on user
    // Both admin and regular users only see their own trades
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
      WHERE deleted_flag = FALSE OR deleted_flag IS NULL
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
      updated_at: row.updated_at ? row.updated_at.toISOString() : undefined,
      user_id: row.user_id
    }))
    
    logger.info(`Fetched ${trades.length} trades for user ${userIdHeader} (admin: ${isAdminHeader})`)
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
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const trade: TradeRecord = await request.json()
    
    // Always use user-specific database connection
    const sql = getUserDb(userIdHeader)
    
    // Insert trade with user_id
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
        ${userIdHeader}
      )
      RETURNING id
    `
    
    logger.info(`Created new trade with ID: ${result[0].id} for user ${userIdHeader}`)
    
    // Invalidate caches if admin (affects portfolio pages which show admin trades)
    if (isAdminHeader) {
      const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated after admin trade creation')
    }
    
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