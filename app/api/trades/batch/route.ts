import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
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
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-auth')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const changes: BatchChanges = await request.json()
    const sql = getDb()
    
    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0
    
    // Start a transaction
    await sql.begin(async sql => {
      // Process new trades
      for (const trade of changes.new) {
        await sql`
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
        `
        createdCount++
      }
      
      // Process updated trades
      for (const trade of changes.updated) {
        if (!trade.id) continue
        
        await sql`
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
        `
        updatedCount++
      }
      
      // Process deleted trades (soft delete)
      for (const tradeId of changes.deleted) {
        await sql`
          UPDATE application.trade_data
          SET
            deleted_flag = TRUE,
            deleted_at = CURRENT_TIMESTAMP
          WHERE id = ${tradeId}
        `
        deletedCount++
      }
    })
    
    logger.info(`Batch update completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`)
    
    // Invalidate cache
    const { invalidateTradeDataCache } = await import('@/lib/trade-data-cache')
    await invalidateTradeDataCache()
    
    return NextResponse.json({ 
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount
    })
    
  } catch (error) {
    logger.error('Error in batch update:', error)
    return NextResponse.json(
      { error: 'Failed to process batch update' },
      { status: 500 }
    )
  }
}