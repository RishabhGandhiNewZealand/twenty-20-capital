#!/usr/bin/env node
import { addSoftDeleteToTradeData } from '../lib/db-migrations'
import { logger } from '../lib/logger'

async function main() {
  try {
    logger.info('Starting soft-delete migration for trade_data table...')
    
    await addSoftDeleteToTradeData()
    
    logger.info('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    logger.error('Migration failed:', error)
    process.exit(1)
  }
}

main()