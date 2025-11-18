import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'
import { guardAdminRoute } from '@/lib/admin-auth'

interface BatchChanges {
  new: TradeRecord[]
  updated: TradeRecord[]
  deleted: number[]
}

export async function POST(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      const userId = request.headers.get('x-user-id') || ''
      const userEmail = request.headers.get('x-user-email') || ''
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const changes: BatchChanges = await request.json()
      const sql = getUserDb(userId)
      
      let createdCount = 0
      let updatedCount = 0
      let deletedCount = 0
      
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
            ${userId}
          )
        `
        createdCount++
      }
      
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
          WHERE id = ${trade.id} AND user_id = ${userId}
        `
        updatedCount++
      }
      
      for (const tradeId of changes.deleted) {
        const result = await sql`
          UPDATE application.trade_data
          SET
            deleted_flag = TRUE,
            deleted_at = CURRENT_TIMESTAMP
          WHERE id = ${tradeId} AND user_id = ${userId}
          RETURNING id
        `
        if (result.length > 0) deletedCount++
      }
      
      logger.info(`Batch update completed for ${userEmail}: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`)
      
      const { invalidatePortfolioCaches } = await import('@/lib/portfolio-cache-service')
      await invalidatePortfolioCaches()
      logger.info('Portfolio caches invalidated after batch trade updates')
      
      return NextResponse.json({ 
        success: true,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
      
    } catch (error) {
      logger.error('Error in batch update:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Failed to process batch update', details: errorMessage },
        { status: 500 }
      )
    }
  })
}