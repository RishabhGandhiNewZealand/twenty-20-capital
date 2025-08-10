import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { TradeRecord } from '@/types/portfolio'

// GET endpoint to fetch all trades (excluding soft-deleted)
export async function GET() {
  try {
    const sql = getDb()
    
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
        created_at,
        updated_at
      FROM application.trade_data
      WHERE deleted_flag = FALSE
      ORDER BY date DESC, id DESC
    `
    
    // Transform database results to match TradeRecord interface with id
    const trades = results.map(row => ({
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
      value: parseFloat(row.value)
    }))
    
    logger.info(`Fetched ${trades.length} trades from database`)
    
    return NextResponse.json({ trades })
  } catch (error) {
    logger.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

// POST endpoint to handle CRUD operations
export async function POST(request: NextRequest) {
  try {
    const { changes } = await request.json()
    
    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Invalid request: changes array required' },
        { status: 400 }
      )
    }
    
    const sql = getDb()
    
    // Begin transaction
    await sql`BEGIN`
    
    try {
      for (const change of changes) {
        if (change.type === 'add' && change.newRecord) {
          // Insert new trade
          const trade = change.newRecord
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
          logger.info(`Added new trade: ${trade.code} on ${trade.date}`)
          
        } else if (change.type === 'edit' && change.originalRecord?.id && change.newRecord) {
          // Update existing trade
          const trade = change.newRecord
          const id = change.originalRecord.id
          
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
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
          `
          logger.info(`Updated trade ID ${id}: ${trade.code}`)
          
        } else if (change.type === 'delete' && change.originalRecord?.id) {
          // Soft delete trade
          const id = change.originalRecord.id
          
          await sql`
            UPDATE application.trade_data
            SET
              deleted_flag = TRUE,
              deleted_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
          `
          logger.info(`Soft deleted trade ID ${id}`)
        }
      }
      
      // Commit transaction
      await sql`COMMIT`
      
      // Fetch updated trades (excluding soft-deleted)
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
          value
        FROM application.trade_data
        WHERE deleted_flag = FALSE
        ORDER BY date DESC, id DESC
      `
      
      const trades = results.map(row => ({
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
        value: parseFloat(row.value)
      }))
      
      logger.info(`Successfully processed ${changes.length} changes`)
      
      return NextResponse.json({ 
        success: true, 
        trades,
        message: `Successfully processed ${changes.length} change(s)`
      })
      
    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`
      throw error
    }
    
  } catch (error) {
    logger.error('Error processing trade changes:', error)
    return NextResponse.json(
      { error: 'Failed to process trade changes' },
      { status: 500 }
    )
  }
}