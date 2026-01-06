import { getDb } from './db'
import { logger } from './logger'


// Function to clean up expired cache entries

// Function to create trade_data table
export async function createTradeDataTable() {
  const sql = getDb()

  try {
    // Create application schema if it doesn't exist
    await sql`CREATE SCHEMA IF NOT EXISTS application`

    // Create the trade_data table
    await sql`
      CREATE TABLE IF NOT EXISTS application.trade_data (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        market_code VARCHAR(10) NOT NULL,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('Buy', 'Sell', 'Reinvestment')),
        qty DECIMAL(18, 8) NOT NULL,
        price DECIMAL(18, 8) NOT NULL,
        instrument_currency VARCHAR(3) NOT NULL,
        brokerage DECIMAL(18, 8) NOT NULL,
        brokerage_currency VARCHAR(3) NOT NULL,
        exch_rate DECIMAL(18, 8) NOT NULL,
        value DECIMAL(18, 8) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_code 
      ON application.trade_data(code)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_date 
      ON application.trade_data(date)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_type 
      ON application.trade_data(type)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_code_date 
      ON application.trade_data(code, date)
    `

    // Create trigger to automatically update updated_at
    await sql`
      DROP TRIGGER IF EXISTS update_trade_data_updated_at ON application.trade_data
    `

    await sql`
      CREATE TRIGGER update_trade_data_updated_at 
      BEFORE UPDATE ON application.trade_data
      FOR EACH ROW 
      EXECUTE FUNCTION application.update_updated_at_column()
    `

    logger.info('Trade data table created successfully')

  } catch (error) {
    logger.error('Error creating trade data table:', error)
    throw error
  }
}

// Function to add soft delete columns to trade_data table
export async function addSoftDeleteToTradeData() {
  const sql = getDb()

  try {
    // Add deleted_flag column if it doesn't exist
    await sql`
      ALTER TABLE application.trade_data 
      ADD COLUMN IF NOT EXISTS deleted_flag BOOLEAN DEFAULT FALSE
    `

    // Add deleted_at column if it doesn't exist
    await sql`
      ALTER TABLE application.trade_data 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE
    `

    // Create index on deleted_flag for fast filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_deleted_flag 
      ON application.trade_data(deleted_flag)
    `

    // Create composite index for common query patterns
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_not_deleted 
      ON application.trade_data(deleted_flag, date DESC)
      WHERE deleted_flag = FALSE
    `

    logger.info('Soft delete columns added to trade_data table successfully')

  } catch (error) {
    logger.error('Error adding soft delete columns to trade_data table:', error)
    throw error
  }
}

export async function addUserIdToTradeData() {
  const sql = getDb()
  try {
    await sql`
			ALTER TABLE application.trade_data 
			ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
		`
    await sql`
			CREATE INDEX IF NOT EXISTS idx_trade_data_user_id 
			ON application.trade_data(user_id)
		`
    await sql`
			CREATE INDEX IF NOT EXISTS idx_trade_data_user_id_date 
			ON application.trade_data(user_id, date)
		`
    const adminUserId = process.env.ADMIN_USER_ID || ''
    if (adminUserId) {
      await sql`
				UPDATE application.trade_data 
				SET user_id = ${adminUserId}
				WHERE user_id IS NULL
			`
    }
    logger.info('user_id column and indexes added to trade_data, existing rows backfilled')
  } catch (error) {
    logger.error('Error adding user_id to trade_data:', error)
    throw error
  }
}