import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

async function verifyMigration() {
  try {
    const sql = getDb()
    
    logger.info('Verifying migration results...')
    
    // Check if schema exists
    const [schema] = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'application'
    `
    logger.info(`Schema 'application' exists: ${!!schema}`)
    
    // Check if table exists
    const [table] = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'application' 
      AND table_name = 'trade_data'
    `
    logger.info(`Table 'application.trade_data' exists: ${!!table}`)
    
    // Get row count
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM application.trade_data`
    logger.info(`Total records in table: ${count}`)
    
    // Check indexes
    const indexes = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'application' 
      AND tablename = 'trade_data'
      ORDER BY indexname
    `
    logger.info('Indexes:')
    indexes.forEach(idx => {
      logger.info(`  - ${idx.indexname}`)
    })
    
    // Get summary by type
    const typesSummary = await sql`
      SELECT type, COUNT(*) as count, SUM(value) as total_value
      FROM application.trade_data
      GROUP BY type
      ORDER BY type
    `
    logger.info('\nSummary by transaction type:')
    console.table(typesSummary)
    
    // Get summary by currency
    const currencySummary = await sql`
      SELECT instrument_currency, COUNT(*) as count, SUM(value) as total_value
      FROM application.trade_data
      GROUP BY instrument_currency
      ORDER BY instrument_currency
    `
    logger.info('\nSummary by currency:')
    console.table(currencySummary)
    
    // Get top 10 stocks by total value
    const topStocks = await sql`
      SELECT code, name, COUNT(*) as transactions, SUM(value) as total_value
      FROM application.trade_data
      GROUP BY code, name
      ORDER BY total_value DESC
      LIMIT 10
    `
    logger.info('\nTop 10 stocks by total value:')
    console.table(topStocks)
    
    logger.info('\nMigration verification completed successfully!')
    
  } catch (error) {
    logger.error('Verification failed:', error)
    throw error
  }
}

// Run verification
verifyMigration()
  .then(() => {
    logger.info('Verification completed')
    process.exit(0)
  })
  .catch(error => {
    logger.error('Verification error:', error)
    process.exit(1)
  })