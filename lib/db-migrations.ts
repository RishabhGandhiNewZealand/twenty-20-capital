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
    
    // Create trigger to automatically update updated_at
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