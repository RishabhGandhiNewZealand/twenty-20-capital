import { createTradeDataTable } from '../lib/db-migrations'
import { logger } from '../lib/logger'

async function main() {
  try {
    console.log('Setting up trade_data table...')
    
    // Create the trade_data table
    await createTradeDataTable()
    
    console.log('✅ Trade data table created successfully!')
    console.log('\nNext steps:')
    console.log('1. Import your trade data into the table using a data migration script')
    console.log('2. The application will automatically use cached queries from the database')
    console.log('3. Data will be cached for 1 hour (3600 seconds) by default')
    
    process.exit(0)
  } catch (error) {
    logger.error('Failed to set up trade_data table:', error)
    console.error('❌ Failed to set up trade_data table:', error)
    process.exit(1)
  }
}

// Run the script
main()