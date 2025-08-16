import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { logger } from './logger'

// Initialize Neon database connection
let sql: NeonQueryFunction<false, false> | null = null

export function getDb() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    logger.info('Initializing database connection with RLS support...')
    sql = neon(databaseUrl)
    logger.info('Database connection initialized successfully')
  }
  
  return sql
}

// Get database connection with user context for RLS
export async function getDbWithUser(userId: string | null) {
  const sql = getDb()
  
  if (!userId) {
    // No user context - queries will be restricted by RLS
    return sql
  }
  
  // Create a wrapper that sets the user context before each query
  return async function userScopedSql(strings: TemplateStringsArray, ...values: any[]) {
    try {
      // Set the user context for RLS
      await sql`SET LOCAL app.user_id = ${userId}`
      
      // Execute the actual query
      const result = await sql(strings, ...values)
      
      return result
    } catch (error) {
      logger.error(`Database query error for user ${userId}:`, error)
      throw error
    }
  }
}

// Helper function to execute queries in a transaction with user context
export async function executeInUserContext<T>(
  userId: string | null,
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  const sql = getDb()
  
  try {
    // Start transaction
    await sql`BEGIN`
    
    // Set user context if provided
    if (userId) {
      await sql`SET LOCAL app.user_id = ${userId}`
    }
    
    // Execute the callback
    const result = await callback(sql)
    
    // Commit transaction
    await sql`COMMIT`
    
    return result
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`
    logger.error(`Transaction error for user ${userId}:`, error)
    throw error
  }
}

// Helper function to bypass RLS for admin operations (use with caution!)
export async function executeAsServiceRole<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  const sql = getDb()
  
  try {
    // Note: This would require a separate connection with service role credentials
    // For now, we'll use the regular connection but document that this should
    // be replaced with a proper service role connection in production
    logger.warn('Executing query with potential RLS bypass - ensure proper authorization')
    
    return await callback(sql)
  } catch (error) {
    logger.error('Service role query error:', error)
    throw error
  }
}

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}