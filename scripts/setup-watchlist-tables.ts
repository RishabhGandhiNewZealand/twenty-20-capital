import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

/**
 * Setup script to create watchlist and scenario tables
 * Run this script to initialize the database schema for watchlist feature
 */

async function setupWatchlistTables() {
  const sql = getDb()
  
  try {
    logger.info('Creating watchlist tables...')
    
    // Create watchlist table
    await sql`
      CREATE TABLE IF NOT EXISTS application.watchlist (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        company_name TEXT NOT NULL,
        ttm_revenue NUMERIC(20, 2),
        market_cap NUMERIC(20, 2),
        current_stock_price NUMERIC(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, ticker)
      )
    `
    logger.info('Watchlist table created successfully')
    
    // Create watchlist_scenarios table
    await sql`
      CREATE TABLE IF NOT EXISTS application.watchlist_scenarios (
        id SERIAL PRIMARY KEY,
        watchlist_id INTEGER NOT NULL REFERENCES application.watchlist(id) ON DELETE CASCADE,
        scenario_name TEXT NOT NULL,
        
        -- Base assumptions
        revenue_growth_2025_2030 NUMERIC(5, 2) NOT NULL,
        ebitda_margin NUMERIC(5, 2) NOT NULL,
        capex_percent NUMERIC(5, 2) NOT NULL,
        tax_rate NUMERIC(5, 2) NOT NULL,
        
        -- 2025 projections
        revenue_2025 NUMERIC(20, 2),
        ebitda_2025 NUMERIC(20, 2),
        capex_2025 NUMERIC(20, 2),
        cash_flow_2025 NUMERIC(20, 2),
        
        -- 2030 projections
        revenue_2030 NUMERIC(20, 2),
        ebitda_2030 NUMERIC(20, 2),
        capex_2030 NUMERIC(20, 2),
        cash_flow_2030 NUMERIC(20, 2),
        
        -- Valuation
        estimated_value NUMERIC(20, 2),
        cagr NUMERIC(5, 2),
        probability NUMERIC(5, 2),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(watchlist_id, scenario_name)
      )
    `
    logger.info('Watchlist scenarios table created successfully')
    
    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON application.watchlist(user_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON application.watchlist(ticker)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_scenarios_watchlist_id ON application.watchlist_scenarios(watchlist_id)
    `
    
    logger.info('Indexes created successfully')
    
    logger.info('✅ Watchlist tables setup completed successfully!')
    
  } catch (error) {
    logger.error('Error setting up watchlist tables:', error)
    throw error
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupWatchlistTables()
    .then(() => {
      logger.info('Script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script failed:', error)
      process.exit(1)
    })
}

export { setupWatchlistTables }
