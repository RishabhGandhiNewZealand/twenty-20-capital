import { addSoftDeleteToTradeData } from '../lib/db-migrations'
import { logger } from '../lib/logger'

async function main() {
  try {
    console.log('Adding soft delete columns to trade_data table...')
    
    // Add soft delete columns
    await addSoftDeleteToTradeData()
    
    console.log('✅ Soft delete columns added successfully!')
    console.log('\nThe following columns have been added:')
    console.log('- deleted_flag: Boolean flag to mark trades as deleted')
    console.log('- deleted_at: Timestamp when the trade was deleted')
    console.log('\nIndexes have been created for optimal query performance.')
    
    process.exit(0)
  } catch (error) {
    logger.error('Failed to add soft delete columns:', error)
    console.error('❌ Failed to add soft delete columns:', error)
    process.exit(1)
  }
}

// Run the script
main()