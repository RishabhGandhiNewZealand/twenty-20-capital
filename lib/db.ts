import { neon } from '@neondatabase/serverless'
import { logger } from './logger'

// Initialize Neon database connection
let sql: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    logger.info('Initializing database connection...')
    sql = neon(databaseUrl)
    logger.info('Database connection initialized successfully')
  }
  
  return sql
}

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}