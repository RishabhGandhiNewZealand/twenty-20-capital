import { downloadTradeDataFromBlob } from '../lib/blob-utils'
import { parseCSVData } from '../lib/portfolio'
import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

async function migrateToApplicationSchema() {
  try {
    logger.info('Starting CSV to Neon migration to application schema')
    
    const sql = getDb()
    
    // Ensure schema exists
    logger.info('Creating application schema if not exists...')
    await sql`CREATE SCHEMA IF NOT EXISTS application`
    
    // Download and parse CSV
    logger.info('Downloading CSV from Vercel Blob...')
    const csvContent = await downloadTradeDataFromBlob()
    
    logger.info('Parsing CSV data...')
    const trades = parseCSVData(csvContent)
    logger.info(`Parsed ${trades.length} trade records`)
    
    if (trades.length === 0) {
      throw new Error('No trade records found in CSV')
    }
    
    // Drop existing table
    logger.info('Dropping existing table if exists...')
    await sql`DROP TABLE IF EXISTS application.trade_data CASCADE`
    
    // Create table
    logger.info('Creating application.trade_data table...')
    await sql`
      CREATE TABLE application.trade_data (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        market_code TEXT NOT NULL,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell', 'Reinvestment')),
        qty DECIMAL(20, 6) NOT NULL,
        price DECIMAL(20, 6) NOT NULL,
        instrument_currency TEXT NOT NULL,
        brokerage DECIMAL(20, 6) NOT NULL,
        brokerage_currency TEXT NOT NULL,
        exch_rate DECIMAL(20, 6) NOT NULL,
        value DECIMAL(20, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    logger.info('Table created successfully')
    
    // Create indexes
    logger.info('Creating indexes...')
    await sql`CREATE INDEX idx_application_trade_data_code ON application.trade_data(code)`
    await sql`CREATE INDEX idx_application_trade_data_date ON application.trade_data(date)`
    await sql`CREATE INDEX idx_application_trade_data_type ON application.trade_data(type)`
    logger.info('Indexes created successfully')
    
    // Insert data - using individual inserts for now
    logger.info('Inserting trade data...')
    let insertedCount = 0
    
    // Use transaction for better performance
    await sql`BEGIN`
    
    try {
      for (const trade of trades) {
        await sql`
          INSERT INTO application.trade_data (
            code, market_code, name, date, type, qty, price,
            instrument_currency, brokerage, brokerage_currency, exch_rate, value
          )
          VALUES (
            ${trade.code}, ${trade.marketCode}, ${trade.name}, ${trade.date}, 
            ${trade.type}, ${trade.qty}, ${trade.price}, ${trade.instrumentCurrency},
            ${trade.brokerage}, ${trade.brokerageCurrency}, ${trade.exchRate}, ${trade.value}
          )
        `
        
        insertedCount++
        if (insertedCount % 100 === 0) {
          logger.info(`Inserted ${insertedCount}/${trades.length} records`)
        }
      }
      
      await sql`COMMIT`
      logger.info(`All ${insertedCount} records inserted successfully`)
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
    
    // Verify migration
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM application.trade_data`
    logger.info(`Migration completed! Total records: ${count}`)
    
    // Show sample data
    const sample = await sql`SELECT * FROM application.trade_data ORDER BY date DESC LIMIT 5`
    logger.info('Sample data (latest 5 trades):')
    console.table(sample)
    
    // Show statistics
    const [stats] = await sql`
      SELECT 
        COUNT(DISTINCT code) as unique_symbols,
        COUNT(DISTINCT market_code) as unique_markets,
        MIN(date)::text as earliest_date,
        MAX(date)::text as latest_date,
        ROUND(SUM(value)::numeric, 2) as total_value
      FROM application.trade_data
    `
    logger.info('Table statistics:')
    console.table(stats)
    
    return { success: true, recordsInserted: count, stats }
    
  } catch (error) {
    logger.error('Migration failed:', error)
    throw error
  }
}

// Run migration
migrateToApplicationSchema()
  .then(result => {
    logger.info('Migration completed successfully')
    process.exit(0)
  })
  .catch(error => {
    logger.error('Migration error:', error)
    process.exit(1)
  })