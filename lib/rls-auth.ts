import { neon } from '@neondatabase/serverless'
import { logger } from './logger'

/**
 * Creates an authenticated database connection with RLS context
 * This sets the authenticated user ID for the current session
 * 
 * Based on Neon's RLS documentation, we set a session variable
 * that can be used in RLS policies
 * 
 * @param userId - The authenticated user ID to set for RLS policies
 * @returns A database connection with RLS context set
 */
export function getAuthenticatedDb(userId?: string) {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Create a new connection for this authenticated session
  const sql = neon(databaseUrl)
  
  // If userId is provided, we need to set the session context
  // This approach works with RLS policies that check current_setting
  if (userId) {
    logger.info(`Setting RLS context for user: ${userId}`)
    
    // Return a wrapper that sets the session context before each query
    return async (strings: TemplateStringsArray, ...values: any[]) => {
      try {
        // Set the session variable that RLS policies can check
        // Using app.current_user_id as the session variable name
        await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
        
        // Execute the actual query
        return await sql(strings, ...values)
      } catch (error) {
        logger.error(`RLS query error for user ${userId}:`, error)
        throw error
      }
    }
  }
  
  return sql
}

/**
 * Gets the admin user ID from environment variable
 * @returns The admin user ID or undefined if not set
 */
export function getAdminUserId(): string | undefined {
  return process.env.ADMIN_USER_ID
}

/**
 * Creates an admin-authenticated database connection
 * This is used for accessing portfolio data which requires admin privileges
 * @returns A database connection authenticated as admin
 */
export function getAdminDb() {
  const adminUserId = getAdminUserId()
  if (!adminUserId) {
    logger.warn('ADMIN_USER_ID not set, using unauthenticated connection. This may fail if RLS is enabled.')
    // Return regular connection without RLS context
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    return neon(databaseUrl)
  }
  
  return getAuthenticatedDb(adminUserId)
}

/**
 * Helper to check if a user is admin
 * @param userId - The user ID to check
 * @returns True if the user is the admin
 */
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false
  const adminUserId = getAdminUserId()
  return adminUserId === userId
}

/**
 * Creates a database connection for a specific user
 * This can be used when implementing user-specific data access
 * @param userId - The user ID to authenticate as
 * @returns A database connection authenticated as the specified user
 */
export function getUserDb(userId: string) {
  if (!userId) {
    throw new Error('User ID is required for authenticated database connection')
  }
  
  logger.info(`Creating user-authenticated DB connection for user: ${userId}`)
  return getAuthenticatedDb(userId)
}

/**
 * Extracts user ID from Stack user object
 * Stack uses different ID fields depending on the auth provider
 * @param user - The Stack user object
 * @returns The user ID or undefined
 */
export function getUserIdFromStackUser(user: any): string | undefined {
  if (!user) return undefined
  
  // Stack user ID is typically in the 'id' field
  return user.id || user.userId || undefined
}

/**
 * Extracts email from Stack user object
 * @param user - The Stack user object
 * @returns The user email or undefined
 */
export function getEmailFromStackUser(user: any): string | undefined {
  if (!user) return undefined
  
  return (
    user?.primaryEmail ||
    user?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.primaryEmailAddress?.email ||
    undefined
  )?.toString()
}

/**
 * Checks if a Stack user is the admin based on email
 * @param user - The Stack user object
 * @returns True if the user is admin
 */
export function isAdminUser(user: any): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !user) return false
  
  const userEmail = getEmailFromStackUser(user)
  return userEmail === adminEmail
}

/**
 * Gets the appropriate database connection for a user
 * Returns admin DB for admin users, user-specific DB for regular users
 * @param user - The Stack user object
 * @returns An authenticated database connection
 */
export function getDbForUser(user: any) {
  if (isAdminUser(user)) {
    logger.info('Using admin database connection')
    return getAdminDb()
  }
  
  const userId = getUserIdFromStackUser(user)
  if (!userId) {
    throw new Error('Unable to extract user ID from user object')
  }
  
  return getUserDb(userId)
}