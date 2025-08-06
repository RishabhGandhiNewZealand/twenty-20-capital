import { getDb, isDatabaseConfigured } from './db'
import { logger } from './logger'
import { createNewsCache } from './db-migrations'

interface CachedNewsData {
  company_name: string
  status: 'news_found' | 'no_significant_news_found'
  summary_points: string[]
  references: Array<{
    title: string
    source_name: string
    url: string
    publication_date: string
    relevance: 'direct' | 'indirect'
  }>
  error?: string
}

interface CacheEntry {
  id: number
  company_name: string
  cache_key: string
  response_data: CachedNewsData
  start_date: string
  end_date: string
  created_at: Date
  expires_at: Date
  request_count: number
}

export class NewsCache {
  private static instance: NewsCache
  private initialized = false
  
  private constructor() {}
  
  static getInstance(): NewsCache {
    if (!NewsCache.instance) {
      NewsCache.instance = new NewsCache()
    }
    return NewsCache.instance
  }
  
  async initialize() {
    if (!isDatabaseConfigured()) {
      logger.warn('Database not configured, caching disabled')
      return
    }
    
    if (this.initialized) {
      logger.info('News cache already initialized')
      return
    }
    
    try {
      logger.info('Initializing news cache...')
      
      // Try to create the cache table (will skip if exists)
      try {
        await createNewsCache()
        logger.info('News cache table created/verified')
      } catch (error: any) {
        // If it's just a "already exists" error, that's fine
        if (error.code !== '42P07' && error.code !== '42710') {
          throw error
        }
        logger.info('News cache table already exists')
      }
      
      this.initialized = true
      logger.info('News cache initialized successfully')
      
      // Test the connection
      const sql = getDb()
      const test = await sql`SELECT COUNT(*) as count FROM application.news_cache`
      const count = Array.isArray(test) && test.length > 0 ? (test[0] as any).count : 0
      logger.info(`News cache table contains ${count} entries`)
    } catch (error) {
      logger.error('Failed to initialize news cache:', error)
      this.initialized = false // Ensure we can retry
      throw error // Re-throw to make initialization failures visible
    }
  }
  
  private generateCacheKey(company: string, startDate: string, endDate: string): string {
    return `${company.toLowerCase().replace(/\s+/g, '_')}_${startDate}_${endDate}`
  }
  
  async get(company: string, startDate: string, endDate: string): Promise<CachedNewsData | null> {
    if (!isDatabaseConfigured() || !this.initialized) {
      logger.warn('Cache not configured or initialized')
      return null
    }
    
    const sql = getDb()
    
    try {
      logger.info(`Looking for fresh cache entry for ${company}`)
      
      // Look for a recent cache entry for this company where the end_date is within 7 days of now
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const results = await sql`
        SELECT * FROM application.news_cache 
        WHERE company_name = ${company}
        AND end_date >= ${sevenDaysAgo.toISOString().split('T')[0]}
        ORDER BY end_date DESC, created_at DESC
        LIMIT 1
      `
      
      if (!Array.isArray(results) || results.length === 0) {
        logger.info(`No fresh cache found for ${company} (within 7 days)`)
        return null
      }
      
      const entry = results[0] as CacheEntry
      const daysSinceEnd = Math.floor((new Date().getTime() - new Date(entry.end_date).getTime()) / (1000 * 60 * 60 * 24))
      
      logger.info(`Found cache entry for ${company}:`)
      logger.info(`  - Date range: ${entry.start_date} to ${entry.end_date}`)
      logger.info(`  - Days since end date: ${daysSinceEnd}`)
      logger.info(`  - Created: ${entry.created_at}`)
      
      // Update access statistics
      await sql`
        UPDATE application.news_cache 
        SET request_count = request_count + 1,
            last_accessed = CURRENT_TIMESTAMP
        WHERE id = ${entry.id}
      `
      
      logger.info(`Cache hit for ${company} (accessed ${entry.request_count + 1} times)`)
      return entry.response_data
      
    } catch (error) {
      logger.error(`Error retrieving from cache for ${company}:`, error)
      return null
    }
  }
  
  async set(
    company: string, 
    startDate: string, 
    endDate: string, 
    data: CachedNewsData
  ): Promise<void> {
    if (!isDatabaseConfigured() || !this.initialized) {
      logger.warn('Cache not configured or initialized, cannot save data')
      return
    }
    
    // Double-check validation before saving
    const isValid = data && 
                   data.status === 'news_found' && 
                   !data.error &&
                   data.summary_points && 
                   data.summary_points.length > 0 &&
                   data.references &&
                   data.references.length > 0
    
    if (!isValid) {
      logger.warn(`Refusing to cache invalid data for ${company}:`)
      logger.warn(`  Status: ${data?.status}`)
      logger.warn(`  Error: ${data?.error || 'none'}`)
      logger.warn(`  Summaries: ${data?.summary_points?.length || 0}`)
      logger.warn(`  References: ${data?.references?.length || 0}`)
      return
    }
    
    const sql = getDb()
    const cacheKey = this.generateCacheKey(company, startDate, endDate)
    // Set expires_at to a far future date (100 years from now) to effectively store forever
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    
    try {
      logger.info(`Saving cache for ${company} with key: ${cacheKey}`)
      logger.info(`Data to cache: ${JSON.stringify(data).substring(0, 200)}...`)
      
      // Upsert the cache entry
      const result = await sql`
        INSERT INTO application.news_cache (
          company_name, 
          cache_key, 
          response_data, 
          start_date, 
          end_date, 
          expires_at
        ) VALUES (
          ${company},
          ${cacheKey},
          ${JSON.stringify(data)},
          ${startDate},
          ${endDate},
          ${expiresAt.toISOString()}
        )
        ON CONFLICT (cache_key) 
        DO UPDATE SET
          response_data = EXCLUDED.response_data,
          expires_at = EXCLUDED.expires_at,
          request_count = application.news_cache.request_count + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, created_at, updated_at
      `
      
      if (Array.isArray(result) && result.length > 0) {
        logger.info(`Successfully cached news data for ${company} (ID: ${(result[0] as any).id})`)
        logger.info(`Cache entry created/updated at: ${(result[0] as any).updated_at || (result[0] as any).created_at}`)
      } else {
        logger.warn(`Cache insert/update returned no results for ${company}`)
      }
      
    } catch (error) {
      logger.error(`Error saving to cache for ${company}:`, error)
      logger.error(`Cache key: ${cacheKey}`)
      logger.error(`Data size: ${JSON.stringify(data).length} bytes`)
      throw error // Re-throw to make errors visible
    }
  }
  
  async invalidate(company: string): Promise<void> {
    if (!isDatabaseConfigured() || !this.initialized) return
    
    const sql = getDb()
    
    try {
      const result = await sql`
        DELETE FROM application.news_cache 
        WHERE company_name = ${company}
        RETURNING id
      `
      
      const deletedCount = Array.isArray(result) ? result.length : 0
      logger.info(`Invalidated ${deletedCount} cache entries for ${company}`)
      
    } catch (error) {
      logger.error('Error invalidating cache:', error)
    }
  }
  
  async getStats(): Promise<{
    totalEntries: number
    activeEntries: number
    expiredEntries: number
    totalRequests: number
    avgRequestsPerEntry: number
  } | null> {
    if (!isDatabaseConfigured() || !this.initialized) return null
    
    const sql = getDb()
    
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(*) FILTER (WHERE expires_at > CURRENT_TIMESTAMP) as active_entries,
          COUNT(*) FILTER (WHERE expires_at <= CURRENT_TIMESTAMP) as expired_entries,
          SUM(request_count) as total_requests,
          AVG(request_count) as avg_requests_per_entry
        FROM application.news_cache
      `
      
      if (!Array.isArray(stats) || stats.length === 0) {
        return null
      }
      
      const stat = stats[0] as any
      return {
        totalEntries: parseInt(stat.total_entries),
        activeEntries: parseInt(stat.active_entries),
        expiredEntries: parseInt(stat.expired_entries),
        totalRequests: parseInt(stat.total_requests || '0'),
        avgRequestsPerEntry: parseFloat(stat.avg_requests_per_entry || '0')
      }
      
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  }
}

// Export singleton instance
export const newsCache = NewsCache.getInstance()