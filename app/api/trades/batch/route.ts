import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

interface BatchChanges {
  new: TradeRecord[]
  updated: TradeRecord[]
  deleted: number[]
}

// POST batch update trades
export async function POST(request: NextRequest) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      logger.error('No user ID provided in batch update request')
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const changes: BatchChanges = await request.json()
    
    logger.info(`Batch update request for user ${userIdHeader}: ${changes.new.length} new, ${changes.updated.length} updated, ${changes.deleted.length} deleted`)
    
    // Always use user-specific database connection
    // Admin can only manage their own trades, just like regular users
    const sql = getUserDb(userIdHeader)
    
    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0
    const errors: string[] = []
    
    // Process new trades
    for (const trade of changes.new) {
      try {
        // Ensure we don't try to insert the temporary ID
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
        createdCount++
        logger.info(`Created trade with ID ${result[0].id} for user ${userIdHeader}`)
      } catch (error) {
        logger.error(`Error creating trade for user ${userIdHeader}:`, error)
        errors.push(`Failed to create trade ${trade.code}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Process updated trades - explicitly filter by user_id for security
    for (const trade of changes.updated) {
      if (!trade.id || typeof trade.id === 'string') {
        logger.warn(`Skipping update for trade with invalid ID: ${trade.id}`)
        continue
      }
      
      try {
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
          WHERE id = ${trade.id}
            AND user_id = ${userIdHeader}
          RETURNING id
        `
        if (result.length > 0) {
          updatedCount++
          logger.info(`Updated trade ID ${trade.id} for user ${userIdHeader}`)
        } else {
          logger.warn(`Trade ID ${trade.id} not found or not owned by user ${userIdHeader}`)
        }
      } catch (error) {
        logger.error(`Error updating trade ID ${trade.id}:`, error)
        errors.push(`Failed to update trade ID ${trade.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Process deleted trades (soft delete) - explicitly filter by user_id for security
    for (const tradeId of changes.deleted) {
      try {
        const result = await sql`
          UPDATE application.trade_data
          SET
            deleted_flag = TRUE,
            deleted_at = CURRENT_TIMESTAMP
          WHERE id = ${tradeId}
            AND user_id = ${userIdHeader}
          RETURNING id
        `
        if (result.length > 0) {
          deletedCount++
          logger.info(`Soft deleted trade ID ${tradeId} for user ${userIdHeader}`)
        } else {
          logger.warn(`Trade ID ${tradeId} not found or not owned by user ${userIdHeader}`)
        }
      } catch (error) {
        logger.error(`Error deleting trade ID ${tradeId}:`, error)
        errors.push(`Failed to delete trade ID ${tradeId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    logger.info(`Batch update completed for user ${userIdHeader}: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`)
    
    // Invalidate caches if admin (affects portfolio pages which show admin trades)
    if (isAdminHeader) {
      const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated after admin batch trade updates')
    }
    
    // Return response with any errors that occurred
    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        errors
      }, { status: 207 }) // 207 Multi-Status
    }
    
    return NextResponse.json({ 
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount
    })
    
  } catch (error) {
    logger.error('Error in batch update:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process batch update', details: errorMessage },
      { status: 500 }
    )
  }
}