import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

async function updateTradeDataTable() {
  const sql = getDb()
  
  try {
    logger.info('Updating trade_data table with soft delete columns...')
    
    // Add soft delete columns if they don't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'application' 
                      AND table_name = 'trade_data' 
                      AND column_name = 'deleted_flag') THEN
          ALTER TABLE application.trade_data ADD COLUMN deleted_flag BOOLEAN DEFAULT FALSE;
          RAISE NOTICE 'Added deleted_flag column';
        ELSE
          RAISE NOTICE 'deleted_flag column already exists';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'application' 
                      AND table_name = 'trade_data' 
                      AND column_name = 'deleted_at') THEN
          ALTER TABLE application.trade_data ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
          RAISE NOTICE 'Added deleted_at column';
        ELSE
          RAISE NOTICE 'deleted_at column already exists';
        END IF;
      END $$;
    `
    
    logger.info('Successfully added soft delete columns')
    
    // Create index on deleted_flag for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_trade_data_deleted_flag 
      ON application.trade_data(deleted_flag)
    `
    
    logger.info('Created index on deleted_flag')
    
    // Verify the columns were added
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'application' 
      AND table_name = 'trade_data'
      AND column_name IN ('deleted_flag', 'deleted_at')
      ORDER BY column_name
    `
    
    logger.info('Soft delete columns verified:')
    result.forEach(col => {
      logger.info(`  - ${col.column_name}: ${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default}`)
    })
    
    process.exit(0)
  } catch (error) {
    logger.error('Error updating trade_data table:', error)
    process.exit(1)
  }
}

updateTradeDataTable()