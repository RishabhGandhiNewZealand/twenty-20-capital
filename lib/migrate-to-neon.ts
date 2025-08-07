import { downloadTradeDataFromBlob } from './blob-utils'
import { parseCSVData } from './portfolio'
import { getDb } from './db'
import { logger } from './logger'

export interface MigrationResult {
  success: boolean
  recordsInserted: number
  stats: {
    unique_symbols: number
    unique_markets: number
    earliest_date: string
    latest_date: string
    total_value: string
  }
}

/**
 * Migrates CSV trade data from Vercel Blob to Neon database
 * 
 * This function:
 * 1. Downloads CSV from Vercel Blob storage
 * 2. Parses the CSV content
 * 3. Creates a new table in Neon database
 * 4. Inserts all trade records
 * 5. Returns migration statistics
 * 
 * @returns Migration result with statistics
 * @throws Error if migration fails
 */
export async function migrateCSVToNeon(): Promise<MigrationResult> {
  const sql = getDb()
  
  try {
    logger.info('Starting CSV to Neon migration...')
    
    // Step 1: Download CSV from Vercel Blob
    logger.info('Downloading CSV from Vercel Blob...')
    const csvContent = await downloadTradeDataFromBlob()
    logger.info('CSV downloaded successfully')
    
    // Step 2: Parse CSV data
    logger.info('Parsing CSV data...')
    const trades = parseCSVData(csvContent)
    logger.info(`Parsed ${trades.length} trade records`)
    
    if (trades.length === 0) {
      throw new Error('No trade records found in CSV')
    }
    
    // Step 3: Create table schema based on the TradeRecord interface
    logger.info('Creating trade_data table...')
    
    // Drop table if exists (for clean migration)
    await sql`DROP TABLE IF EXISTS trade_data CASCADE`
    
    // Create table with proper schema
    const createTableQuery = `
      CREATE TABLE trade_data (
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
    
    await sql(createTableQuery)
    logger.info('Table created successfully')
    
    // Create indexes for better query performance
    await sql`CREATE INDEX idx_trade_data_code ON trade_data(code)`
    await sql`CREATE INDEX idx_trade_data_date ON trade_data(date)`
    await sql`CREATE INDEX idx_trade_data_type ON trade_data(type)`
    logger.info('Indexes created successfully')
    
    // Step 4: Insert data in batches
    logger.info('Inserting trade data...')
    const batchSize = 100
    let insertedCount = 0
    
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize)
      
      // Prepare batch insert values
      const values = batch.map(trade => ({
        code: trade.code,
        market_code: trade.marketCode,
        name: trade.name,
        date: trade.date,
        type: trade.type,
        qty: trade.qty,
        price: trade.price,
        instrument_currency: trade.instrumentCurrency,
        brokerage: trade.brokerage,
        brokerage_currency: trade.brokerageCurrency,
        exch_rate: trade.exchRate,
        value: trade.value
      }))
      
      // Insert batch
      await sql`
        INSERT INTO trade_data (
          code, market_code, name, date, type, qty, price,
          instrument_currency, brokerage, brokerage_currency, exch_rate, value
        )
        VALUES ${sql(values)}
      `
      
      insertedCount += batch.length
      logger.info(`Inserted ${insertedCount}/${trades.length} records`)
    }
    
    // Step 5: Verify migration
    const count = await sql`SELECT COUNT(*) as count FROM trade_data`
    const totalCount = parseInt(count[0].count)
    
    logger.info(`Migration completed successfully! Total records in database: ${totalCount}`)
    
    // Get table statistics
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT code) as unique_symbols,
        COUNT(DISTINCT market_code) as unique_markets,
        MIN(date)::text as earliest_date,
        MAX(date)::text as latest_date,
        SUM(value)::text as total_value
      FROM trade_data
    `
    
    return {
      success: true,
      recordsInserted: totalCount,
      stats: stats[0] as any
    }
    
  } catch (error) {
    logger.error('Migration failed:', error)
    throw error
  }
}