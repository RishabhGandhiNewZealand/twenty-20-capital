import { getDb } from './db'
import { logger } from './logger'

export async function createNewsCache() {
  const sql = getDb()
  
  try {
    // Create application schema if it doesn't exist
    await sql`CREATE SCHEMA IF NOT EXISTS application`
    
    // Create the news_cache table
    await sql`
      CREATE TABLE IF NOT EXISTS application.news_cache (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        cache_key VARCHAR(255) NOT NULL UNIQUE,
        response_data JSONB NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        request_count INTEGER DEFAULT 1,
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Create indexes for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_news_cache_company_name 
      ON application.news_cache(company_name)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_news_cache_cache_key 
      ON application.news_cache(cache_key)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_news_cache_dates 
      ON application.news_cache(start_date, end_date)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_news_cache_expires_at 
      ON application.news_cache(expires_at)
    `
    
    // Create a function to update the updated_at timestamp
    await sql`
      CREATE OR REPLACE FUNCTION application.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `
    
    // Create trigger to automatically update updated_at (if it doesn't exist)
    await sql`
      DROP TRIGGER IF EXISTS update_news_cache_updated_at ON application.news_cache
    `
    
    await sql`
      CREATE TRIGGER update_news_cache_updated_at 
      BEFORE UPDATE ON application.news_cache
      FOR EACH ROW 
      EXECUTE FUNCTION application.update_updated_at_column()
    `
    
    logger.info('News cache table created successfully')
    
  } catch (error) {
    logger.error('Error creating news cache table:', error)
    throw error
  }
}

// Function to clean up expired cache entries
export async function cleanupExpiredCache() {
  const sql = getDb()
  
  try {
    const result = await sql`
      DELETE FROM application.news_cache 
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `
    
    logger.info(`Cleaned up ${result.length} expired cache entries`)
    return result.length
    
  } catch (error) {
    logger.error('Error cleaning up expired cache:', error)
    throw error
  }
}

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

// Function to add soft-delete columns to trade_data table
export async function addSoftDeleteToTradeData() {
  const sql = getDb()
  
  try {
    // Add deleted_flag column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'application' 
          AND table_name = 'trade_data' 
          AND column_name = 'deleted_flag'
        ) THEN
          ALTER TABLE application.trade_data 
          ADD COLUMN deleted_flag BOOLEAN DEFAULT FALSE;
        END IF;
      END $$
    `
    
    // Add deleted_at column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'application' 
          AND table_name = 'trade_data' 
          AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE application.trade_data 
          ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$
    `
    
    // Create index on deleted_flag for fast filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_deleted_flag 
      ON application.trade_data(deleted_flag)
    `
    
    logger.info('Soft-delete columns added to trade_data table successfully')
    
  } catch (error) {
    logger.error('Error adding soft-delete columns:', error)
    throw error
  }
}