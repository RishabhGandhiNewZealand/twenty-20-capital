import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

/**
 * Migration script to add user_id column to trade_data table
 * This enables user-specific trade management with RLS
 */
async function addUserIdToTrades() {
  const sql = getDb()
  
  try {
    logger.info('Starting migration: Adding user_id to trade_data table...')
    
    // Add user_id column if it doesn't exist
    await sql`
      ALTER TABLE application.trade_data 
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `
    logger.info('Added user_id column')
    
    // Create index on user_id for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_user_id 
      ON application.trade_data(user_id)
    `
    logger.info('Created index on user_id')
    
    // Create composite index for user-specific queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_user_id_date 
      ON application.trade_data(user_id, date DESC)
    `
    logger.info('Created composite index on user_id and date')
    
    // Update existing trades to assign them to admin user if ADMIN_USER_ID is set
    const adminUserId = process.env.ADMIN_USER_ID
    if (adminUserId) {
      const result = await sql`
        UPDATE application.trade_data 
        SET user_id = ${adminUserId}
        WHERE user_id IS NULL
      `
      logger.info(`Updated ${result.count} existing trades with admin user_id`)
    } else {
      logger.warn('ADMIN_USER_ID not set - existing trades will not have user_id assigned')
    }
    
    logger.info('Migration completed successfully!')
    
  } catch (error) {
    logger.error('Error during migration:', error)
    throw error
  }
}

// Run the migration
addUserIdToTrades()
  .then(() => {
    logger.info('Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Migration script failed:', error)
    process.exit(1)
  })