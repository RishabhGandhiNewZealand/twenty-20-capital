import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'

/**
 * Watchlist Scenarios API endpoints
 * POST - Add or update scenarios for a watchlist item
 */

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
    const { watchlistId, scenarios } = body
    
    if (!watchlistId || !scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json(
        { error: 'watchlistId and scenarios array are required' },
        { status: 400 }
      )
    }

    const sql = getUserDb(userId)
    
    // Verify watchlist item belongs to user
    const watchlistCheck = await sql`
      SELECT id FROM application.watchlist
      WHERE id = ${watchlistId} AND user_id = ${userId}
    `
    
    if (watchlistCheck.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist item not found or unauthorized' },
        { status: 404 }
      )
    }
    
    // Delete existing scenarios for this watchlist item
    await sql`
      DELETE FROM application.watchlist_scenarios
      WHERE watchlist_id = ${watchlistId}
    `
    
    // Insert new scenarios
    const insertedScenarios = []
    for (const scenario of scenarios) {
      const result = await sql`
        INSERT INTO application.watchlist_scenarios (
          watchlist_id,
          scenario_name,
          revenue_growth_2025_2030,
          ebitda_margin,
          capex_percent,
          tax_rate,
          revenue_2025,
          ebitda_2025,
          capex_2025,
          cash_flow_2025,
          revenue_2030,
          ebitda_2030,
          capex_2030,
          cash_flow_2030,
          estimated_value,
          cagr,
          probability
        ) VALUES (
          ${watchlistId},
          ${scenario.scenarioName},
          ${scenario.revenueGrowth20252030},
          ${scenario.ebitdaMargin},
          ${scenario.capexPercent},
          ${scenario.taxRate},
          ${scenario.revenue2025 || null},
          ${scenario.ebitda2025 || null},
          ${scenario.capex2025 || null},
          ${scenario.cashFlow2025 || null},
          ${scenario.revenue2030 || null},
          ${scenario.ebitda2030 || null},
          ${scenario.capex2030 || null},
          ${scenario.cashFlow2030 || null},
          ${scenario.estimatedValue || null},
          ${scenario.cagr || null},
          ${scenario.probability || null}
        )
        RETURNING id
      `
      insertedScenarios.push(result[0].id)
    }
    
    logger.info(`Added ${insertedScenarios.length} scenarios for watchlist ${watchlistId} for user ${userEmail}`)
    
    return NextResponse.json({ 
      success: true,
      scenarioIds: insertedScenarios
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error saving scenarios:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to save scenarios', details: errorMessage },
      { status: 500 }
    )
  }
}
