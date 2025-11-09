import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'

/**
 * Watchlist API endpoints
 * GET - Fetch user's watchlist or Rish's watchlist
 * POST - Add a company to watchlist
 */

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const searchParams = request.nextUrl.searchParams
    const isRishWatchlist = searchParams.get('rish') === 'true'
    const adminEmail = process.env.ADMIN_EMAIL || ''
    
    // For Rish's watchlist, use admin user ID
    let targetUserId = userId
    if (isRishWatchlist) {
      // Get admin user ID - you may need to adjust this based on your auth system
      targetUserId = 'rish_admin' // Or fetch from database based on adminEmail
    }
    
    if (!targetUserId && !isRishWatchlist) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sql = getUserDb(targetUserId || userId)
    
    // Fetch watchlist with scenarios
    const watchlistItems = await sql`
      SELECT 
        w.id,
        w.user_id,
        w.ticker,
        w.company_name,
        w.ttm_revenue,
        w.market_cap,
        w.current_stock_price,
        w.notes,
        w.created_at,
        w.updated_at
      FROM application.watchlist w
      WHERE w.user_id = ${targetUserId || userId}
      ORDER BY w.created_at DESC
    `
    
    // Fetch all scenarios for these watchlist items
    const watchlistIds = watchlistItems.map(item => item.id)
    let scenarios: any[] = []
    
    if (watchlistIds.length > 0) {
      scenarios = await sql`
        SELECT 
          s.*
        FROM application.watchlist_scenarios s
        WHERE s.watchlist_id = ANY(${watchlistIds})
        ORDER BY s.watchlist_id, s.scenario_name
      `
    }
    
    // Group scenarios by watchlist_id
    const scenariosByWatchlistId = scenarios.reduce((acc: any, scenario: any) => {
      if (!acc[scenario.watchlist_id]) {
        acc[scenario.watchlist_id] = []
      }
      acc[scenario.watchlist_id].push({
        id: scenario.id,
        scenarioName: scenario.scenario_name,
        revenueGrowth20252030: parseFloat(scenario.revenue_growth_2025_2030),
        ebitdaMargin: parseFloat(scenario.ebitda_margin),
        capexPercent: parseFloat(scenario.capex_percent),
        taxRate: parseFloat(scenario.tax_rate),
        revenue2025: scenario.revenue_2025 ? parseFloat(scenario.revenue_2025) : null,
        ebitda2025: scenario.ebitda_2025 ? parseFloat(scenario.ebitda_2025) : null,
        capex2025: scenario.capex_2025 ? parseFloat(scenario.capex_2025) : null,
        cashFlow2025: scenario.cash_flow_2025 ? parseFloat(scenario.cash_flow_2025) : null,
        revenue2030: scenario.revenue_2030 ? parseFloat(scenario.revenue_2030) : null,
        ebitda2030: scenario.ebitda_2030 ? parseFloat(scenario.ebitda_2030) : null,
        capex2030: scenario.capex_2030 ? parseFloat(scenario.capex_2030) : null,
        cashFlow2030: scenario.cash_flow_2030 ? parseFloat(scenario.cash_flow_2030) : null,
        estimatedValue: scenario.estimated_value ? parseFloat(scenario.estimated_value) : null,
        cagr: scenario.cagr ? parseFloat(scenario.cagr) : null,
        probability: scenario.probability ? parseFloat(scenario.probability) : null,
      })
      return acc
    }, {})
    
    // Combine watchlist items with their scenarios
    const watchlist = watchlistItems.map(item => ({
      id: item.id,
      userId: item.user_id,
      ticker: item.ticker,
      companyName: item.company_name,
      ttmRevenue: item.ttm_revenue ? parseFloat(item.ttm_revenue) : null,
      marketCap: item.market_cap ? parseFloat(item.market_cap) : null,
      currentStockPrice: item.current_stock_price ? parseFloat(item.current_stock_price) : null,
      notes: item.notes,
      scenarios: scenariosByWatchlistId[item.id] || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
    
    logger.info(`Fetched ${watchlist.length} watchlist items for user ${targetUserId || userId}`)
    return NextResponse.json(watchlist, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error fetching watchlist:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch watchlist', details: errorMessage },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { 
      ticker, 
      companyName, 
      ttmRevenue, 
      marketCap, 
      currentStockPrice,
      notes 
    } = body
    
    if (!ticker || !companyName) {
      return NextResponse.json(
        { error: 'Ticker and company name are required' },
        { status: 400 }
      )
    }

    const sql = getUserDb(userId)
    
    // Insert or update watchlist item
    const result = await sql`
      INSERT INTO application.watchlist (
        user_id,
        ticker,
        company_name,
        ttm_revenue,
        market_cap,
        current_stock_price,
        notes,
        updated_at
      ) VALUES (
        ${userId},
        ${ticker.toUpperCase()},
        ${companyName},
        ${ttmRevenue || null},
        ${marketCap || null},
        ${currentStockPrice || null},
        ${notes || null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id, ticker) 
      DO UPDATE SET
        company_name = EXCLUDED.company_name,
        ttm_revenue = EXCLUDED.ttm_revenue,
        market_cap = EXCLUDED.market_cap,
        current_stock_price = EXCLUDED.current_stock_price,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `
    
    logger.info(`Added/Updated watchlist item ${ticker} for user ${userEmail}`)
    
    return NextResponse.json({ 
      id: result[0].id, 
      success: true 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error adding to watchlist:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add to watchlist', details: errorMessage },
      { status: 500 }
    )
  }
}
