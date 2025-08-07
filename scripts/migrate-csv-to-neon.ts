import { downloadTradeDataFromBlob } from '@/lib/blob-utils'
import { parseCSVData } from '@/lib/portfolio'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'

// Type mapping function to infer SQL data types from values
function inferSQLType(value: any, fieldName: string): string {
  if (value === null || value === undefined || value === '') {
    return 'TEXT' // Default to TEXT for empty values
  }

  // Check for specific field names that should have specific types
  if (fieldName.toLowerCase().includes('date')) {
    return 'DATE'
  }
  
  if (fieldName.toLowerCase().includes('currency') || 
      fieldName.toLowerCase().includes('code') || 
      fieldName.toLowerCase().includes('name') ||
      fieldName.toLowerCase().includes('type')) {
    return 'TEXT'
  }

  // Check if it's a number
  if (!isNaN(Number(value))) {
    const num = Number(value)
    if (Number.isInteger(num)) {
      return 'INTEGER'
    } else {
      return 'DECIMAL(20, 6)' // High precision for financial data
    }
  }

  // Check if it's a boolean
  if (value === 'true' || value === 'false' || typeof value === 'boolean') {
    return 'BOOLEAN'
  }

  // Default to TEXT
  return 'TEXT'
}

// Function to convert field names to snake_case for SQL
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

// Main migration function
export async function migrateCSVToNeon() {
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
    const totalCount = count[0].count
    
    logger.info(`Migration completed successfully! Total records in database: ${totalCount}`)
    
    // Display sample data
    const sample = await sql`SELECT * FROM trade_data LIMIT 5`
    logger.info('Sample data from migrated table:')
    console.table(sample)
    
    // Display table statistics
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT code) as unique_symbols,
        COUNT(DISTINCT market_code) as unique_markets,
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        SUM(value) as total_value
      FROM trade_data
    `
    logger.info('Table statistics:')
    console.table(stats)
    
    return {
      success: true,
      recordsInserted: totalCount,
      stats: stats[0]
    }
    
  } catch (error) {
    logger.error('Migration failed:', error)
    throw error
  }
}

// Execute migration if running directly
if (require.main === module) {
  migrateCSVToNeon()
    .then(result => {
      logger.info('Migration completed:', result)
      process.exit(0)
    })
    .catch(error => {
      logger.error('Migration failed:', error)
      process.exit(1)
    })
}