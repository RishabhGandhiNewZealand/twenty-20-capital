import { downloadTradeDataFromBlob } from '../lib/blob-utils'
import { parseCSVData } from '../lib/portfolio'
import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

async function populateTradeData() {
  try {
    logger.info('Starting data population for application.trade_data table')
    
    const sql = getDb()
    
    // First, check if table exists and is empty
    const [{ count: existingCount }] = await sql`
      SELECT COUNT(*) as count FROM application.trade_data
    `
    
    if (parseInt(existingCount) > 0) {
      logger.warn(`Table already contains ${existingCount} records. Clearing existing data...`)
      await sql`TRUNCATE TABLE application.trade_data RESTART IDENTITY`
      logger.info('Existing data cleared')
    }
    
    // Download and parse CSV
    logger.info('Downloading CSV from Vercel Blob...')
    const csvContent = await downloadTradeDataFromBlob()
    
    logger.info('Parsing CSV data...')
    const trades = parseCSVData(csvContent)
    logger.info(`Parsed ${trades.length} trade records`)
    
    if (trades.length === 0) {
      throw new Error('No trade records found in CSV')
    }
    
    // Insert data using transaction for better performance
    logger.info('Starting data insertion...')
    let insertedCount = 0
    
    await sql`BEGIN`
    
    try {
      for (const trade of trades) {
        await sql`
          INSERT INTO application.trade_data (
            code, market_code, name, date, type, qty, price,
            instrument_currency, brokerage, brokerage_currency, exch_rate, value
          )
          VALUES (
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
        
        insertedCount++
        if (insertedCount % 50 === 0) {
          logger.info(`Progress: ${insertedCount}/${trades.length} records inserted`)
        }
      }
      
      await sql`COMMIT`
      logger.info(`Successfully inserted all ${insertedCount} records`)
      
    } catch (error) {
      await sql`ROLLBACK`
      logger.error('Error during insertion, transaction rolled back')
      throw error
    }
    
    // Verify final count
    const [{ count: finalCount }] = await sql`
      SELECT COUNT(*) as count FROM application.trade_data
    `
    logger.info(`Final record count in table: ${finalCount}`)
    
    // Show sample of inserted data
    const sample = await sql`
      SELECT * FROM application.trade_data 
      ORDER BY date DESC 
      LIMIT 5
    `
    logger.info('Sample of inserted data (latest 5 trades):')
    console.table(sample.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name.substring(0, 30) + (row.name.length > 30 ? '...' : ''),
      date: row.date,
      type: row.type,
      qty: row.qty,
      value: row.value
    })))
    
    // Show summary statistics
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT code) as unique_symbols,
        COUNT(DISTINCT market_code) as unique_markets,
        MIN(date)::text as earliest_date,
        MAX(date)::text as latest_date,
        ROUND(SUM(CASE WHEN type = 'Buy' THEN value ELSE 0 END)::numeric, 2) as total_buy_value,
        ROUND(SUM(CASE WHEN type = 'Sell' THEN ABS(value) ELSE 0 END)::numeric, 2) as total_sell_value,
        ROUND(SUM(value)::numeric, 2) as net_value
      FROM application.trade_data
    `
    logger.info('\nTable Statistics:')
    console.table(stats)
    
    return {
      success: true,
      recordsInserted: insertedCount,
      finalCount: parseInt(finalCount)
    }
    
  } catch (error) {
    logger.error('Population failed:', error)
    throw error
  }
}

// Run population
populateTradeData()
  .then(result => {
    logger.info('Data population completed successfully:', result)
    process.exit(0)
  })
  .catch(error => {
    logger.error('Data population error:', error)
    process.exit(1)
  })