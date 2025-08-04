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
    
    if (this.initialized) return
    
    try {
      await createNewsCache()
      this.initialized = true
      logger.info('News cache initialized')
    } catch (error) {
      logger.error('Failed to initialize news cache:', error)
    }
  }
  
  private generateCacheKey(company: string, startDate: string, endDate: string): string {
    return `${company.toLowerCase().replace(/\s+/g, '_')}_${startDate}_${endDate}`
  }
  
  async get(company: string, startDate: string, endDate: string): Promise<CachedNewsData | null> {
    if (!isDatabaseConfigured() || !this.initialized) return null
    
    const sql = getDb()
    const cacheKey = this.generateCacheKey(company, startDate, endDate)
    
    try {
      // Look for cached entry that's not expired
      const results = await sql<CacheEntry[]>`
        SELECT * FROM application.news_cache 
        WHERE cache_key = ${cacheKey} 
        AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `
      
      if (results.length === 0) {
        logger.info(`Cache miss for ${company}`)
        return null
      }
      
      const entry = results[0]
      
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
      logger.error('Error retrieving from cache:', error)
      return null
    }
  }
  
  async set(
    company: string, 
    startDate: string, 
    endDate: string, 
    data: CachedNewsData,
    ttlHours: number = 24
  ): Promise<void> {
    if (!isDatabaseConfigured() || !this.initialized) return
    
    const sql = getDb()
    const cacheKey = this.generateCacheKey(company, startDate, endDate)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + ttlHours)
    
    try {
      // Upsert the cache entry
      await sql`
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
      `
      
      logger.info(`Cached news data for ${company}`)
      
    } catch (error) {
      logger.error('Error saving to cache:', error)
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
      
      logger.info(`Invalidated ${result.length} cache entries for ${company}`)
      
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
      
      return {
        totalEntries: parseInt(stats[0].total_entries),
        activeEntries: parseInt(stats[0].active_entries),
        expiredEntries: parseInt(stats[0].expired_entries),
        totalRequests: parseInt(stats[0].total_requests || '0'),
        avgRequestsPerEntry: parseFloat(stats[0].avg_requests_per_entry || '0')
      }
      
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  }
}

// Export singleton instance
export const newsCache = NewsCache.getInstance()