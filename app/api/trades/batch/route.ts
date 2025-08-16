import { NextRequest, NextResponse } from 'next/server'
import { executeInUserContext } from '@/lib/db-with-rls'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'
import { requireAuth, createAuthenticatedResponse } from '@/lib/auth'

interface BatchUpdateRequest {
  trades: TradeRecord[]
}

// POST batch update trades for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    
    const { trades }: BatchUpdateRequest = await request.json()
    
    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json(
        { error: 'Invalid request: trades array is required' },
        { status: 400 }
      )
    }
    
    logger.info(`Starting batch update of ${trades.length} trades for user ${user.id}`)
    
    // Execute all operations in a single transaction with user context
    const results = await executeInUserContext(user.id, async (sql) => {
      const updateResults = []
      
      for (const trade of trades) {
        if (!trade.id) {
          // Insert new trade
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
              user_id,
              deleted_flag
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
              ${user.id},
              ${trade.deleted_flag || false}
            )
            RETURNING id
          `
          updateResults.push({ 
            action: 'inserted', 
            id: result[0].id,
            trade: { ...trade, id: result[0].id }
          })
        } else {
          // Update existing trade (verify ownership through user_id)
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
            WHERE id = ${trade.id}
              AND user_id = ${user.id}
            RETURNING id
          `
          
          if (result.length === 0) {
            throw new Error(`Trade ${trade.id} not found or access denied`)
          }
          
          updateResults.push({ 
            action: trade.deleted_flag ? 'soft-deleted' : 'updated', 
            id: trade.id,
            trade 
          })
        }
      }
      
      return updateResults
    })
    
    const insertedCount = results.filter(r => r.action === 'inserted').length
    const updatedCount = results.filter(r => r.action === 'updated').length
    const deletedCount = results.filter(r => r.action === 'soft-deleted').length
    
    logger.info(`Batch update completed for user ${user.id}: ${insertedCount} inserted, ${updatedCount} updated, ${deletedCount} soft-deleted`)
    
    // Invalidate portfolio caches for this user
    const { invalidateUserPortfolioCaches } = await import('@/lib/portfolio-cache-service')
    await invalidateUserPortfolioCaches(user.id)
    logger.info(`Portfolio caches invalidated for user ${user.id} after batch update`)
    
    return createAuthenticatedResponse({
      success: true,
      summary: {
        total: trades.length,
        inserted: insertedCount,
        updated: updatedCount,
        deleted: deletedCount
      },
      results
    })
    
  } catch (error) {
    logger.error('Error in batch trade update:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update trades', details: errorMessage },
      { status: 500 }
    )
  }
}