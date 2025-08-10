import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'

interface BatchOperation {
  operation: 'create' | 'update' | 'delete' | 'restore'
  trade: any
}

// POST /api/trades/batch - Batch operations for trades
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

    const { operations }: { operations: BatchOperation[] } = await request.json()
    const sql = getDb()
    
    const results = []
    
    // Process each operation in a transaction
    await sql.begin(async sql => {
      for (const op of operations) {
        switch (op.operation) {
          case 'create':
            const created = await sql`
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
                ${op.trade.code},
                ${op.trade.marketCode},
                ${op.trade.name},
                ${op.trade.date},
                ${op.trade.type},
                ${op.trade.qty},
                ${op.trade.price},
                ${op.trade.instrumentCurrency},
                ${op.trade.brokerage},
                ${op.trade.brokerageCurrency},
                ${op.trade.exchRate},
                ${op.trade.value}
              )
              RETURNING id
            `
            results.push({ 
              operation: 'create', 
              success: true, 
              id: created[0].id,
              tempId: op.trade.tempId 
            })
            logger.info(`Created trade with ID: ${created[0].id}`)
            break
            
          case 'update':
            await sql`
              UPDATE application.trade_data
              SET
                code = ${op.trade.code},
                market_code = ${op.trade.marketCode},
                name = ${op.trade.name},
                date = ${op.trade.date},
                type = ${op.trade.type},
                qty = ${op.trade.qty},
                price = ${op.trade.price},
                instrument_currency = ${op.trade.instrumentCurrency},
                brokerage = ${op.trade.brokerage},
                brokerage_currency = ${op.trade.brokerageCurrency},
                exch_rate = ${op.trade.exchRate},
                value = ${op.trade.value}
              WHERE id = ${op.trade.id}
            `
            results.push({ 
              operation: 'update', 
              success: true, 
              id: op.trade.id 
            })
            logger.info(`Updated trade ID: ${op.trade.id}`)
            break
            
          case 'delete':
            await sql`
              UPDATE application.trade_data
              SET
                deleted_flag = TRUE,
                deleted_at = CURRENT_TIMESTAMP
              WHERE id = ${op.trade.id}
            `
            results.push({ 
              operation: 'delete', 
              success: true, 
              id: op.trade.id 
            })
            logger.info(`Soft-deleted trade ID: ${op.trade.id}`)
            break
            
          case 'restore':
            await sql`
              UPDATE application.trade_data
              SET
                deleted_flag = FALSE,
                deleted_at = NULL
              WHERE id = ${op.trade.id}
            `
            results.push({ 
              operation: 'restore', 
              success: true, 
              id: op.trade.id 
            })
            logger.info(`Restored trade ID: ${op.trade.id}`)
            break
            
          default:
            logger.warn(`Unknown operation: ${op.operation}`)
        }
      }
    })
    
    // Invalidate cache after successful batch operations
    const { revalidateTag } = require('next/cache')
    revalidateTag('trade-data')
    
    logger.info(`Batch operations completed: ${results.length} operations processed`)
    
    return NextResponse.json({ 
      success: true, 
      results,
      message: `Successfully processed ${results.length} operations`
    })
    
  } catch (error) {
    logger.error('Error processing batch operations:', error)
    return NextResponse.json(
      { error: 'Failed to process batch operations' },
      { status: 500 }
    )
  }
}