/**
 * Centralized Cache Manager for Portfolio Graph Data
 * 
 * This module provides a robust caching solution with:
 * - Time-based cache expiration (TTL)
 * - Event-based cache invalidation
 * - Key versioning for cache busting
 * - Async cache refresh without blocking
 * - Cache statistics and monitoring
 */

import NodeCache from 'node-cache'
import { logger } from './logger'
import EventEmitter from 'events'

// Cache configuration
const CACHE_TTL_SECONDS = 1200 // 20 minutes default TTL
const CHECK_PERIOD_SECONDS = 60 // Check for expired keys every minute

// Cache event types
export enum CacheEvent {
  TRADE_UPDATED = 'trade:updated',
  CACHE_BUSTED = 'cache:busted',
  CACHE_REFRESHED = 'cache:refreshed',
  CACHE_EXPIRED = 'cache:expired'
}

// Cache key types for different data
export enum CacheKey {
  PORTFOLIO_HISTORY = 'portfolio:history',
  PORTFOLIO_CURRENT = 'portfolio:current',
  PORTFOLIO_COMPOSITION = 'portfolio:composition',
  TRADE_DATA = 'trade:data',
  STOCK_PRICES = 'stock:prices',
  EQUITY_ANALYSIS = 'equity:analysis'
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  useClones?: boolean // Whether to clone values on get/set
  deleteOnExpire?: boolean // Delete expired keys automatically
}

interface CacheEntry<T> {
  data: T
  version: number
  createdAt: Date
  lastAccessed: Date
  accessCount: number
}

class CacheManager extends EventEmitter {
  private cache: NodeCache
  private keyVersions: Map<string, number>
  private refreshCallbacks: Map<string, () => Promise<any>>
  private refreshInProgress: Set<string>

  constructor(options: CacheOptions = {}) {
    super()

    this.cache = new NodeCache({
      stdTTL: options.ttl || CACHE_TTL_SECONDS,
      checkperiod: CHECK_PERIOD_SECONDS,
      useClones: options.useClones !== false,
      deleteOnExpire: options.deleteOnExpire !== false
    })

    this.keyVersions = new Map()
    this.refreshCallbacks = new Map()
    this.refreshInProgress = new Set()

    // Set up cache event listeners
    this.setupEventListeners()

    logger.info('Cache Manager initialized', {
      ttl: options.ttl || CACHE_TTL_SECONDS,
      checkPeriod: CHECK_PERIOD_SECONDS
    })
  }

  private setupEventListeners() {
    // Handle expired keys
    this.cache.on('expired', (key: string, value: any) => {
      logger.info(`Cache key expired: ${key}`)
      this.emit(CacheEvent.CACHE_EXPIRED, { key, value })

      // Trigger async refresh if callback is registered
      if (this.refreshCallbacks.has(key)) {
        this.refreshCacheAsync(key)
      }
    })

    // Handle deleted keys
    this.cache.on('del', (key: string, value: any) => {
      logger.debug(`Cache key deleted: ${key}`)
    })

    // Handle cache flush
    this.cache.on('flush', () => {
      logger.info('Cache flushed')
      this.keyVersions.clear()
    })
  }

  /**
   * Get data from cache with version checking
   */
  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    try {
      const versionedKey = this.getVersionedKey(key)
      const entry = this.cache.get<CacheEntry<T>>(versionedKey)

      if (entry) {
        // Update access metadata
        entry.lastAccessed = new Date()
        entry.accessCount++
        this.cache.set(versionedKey, entry)

        logger.debug(`Cache hit for key: ${key} (v${entry.version})`)
        return entry
      }

      logger.debug(`Cache miss for key: ${key}`)
      return undefined
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error)
      return undefined
    }
  }

  /**
   * Set data in cache with versioning
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const version = this.incrementVersion(key)
      const versionedKey = this.getVersionedKey(key)

      const entry: CacheEntry<T> = {
        data,
        version,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0
      }

      const success = this.cache.set(versionedKey, entry, ttl || CACHE_TTL_SECONDS)

      if (success) {
        logger.info(`Cache set for key: ${key} (v${version}), TTL: ${ttl || CACHE_TTL_SECONDS}s`)
        this.emit(CacheEvent.CACHE_REFRESHED, { key, version })
      }

      return success
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error)
      return false
    }
  }

  /**
   * Bust cache by incrementing version (doesn't delete, creates new version)
   */
  async bust(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key]

    for (const k of keys) {
      const oldVersion = this.keyVersions.get(k) || 0
      const newVersion = this.incrementVersion(k)

      logger.info(`Cache busted for key: ${k} (v${oldVersion} -> v${newVersion})`)
      this.emit(CacheEvent.CACHE_BUSTED, { key: k, oldVersion, newVersion })

      // Trigger async refresh if callback is registered
      if (this.refreshCallbacks.has(k)) {
        await this.refreshCacheAsync(k)
      }
    }
  }

  /**
   * Register a callback to refresh cache data
   */
  registerRefreshCallback(key: string, callback: () => Promise<any>): void {
    this.refreshCallbacks.set(key, callback)
    logger.info(`Refresh callback registered for key: ${key}`)
  }

  /**
   * Refresh cache asynchronously without blocking
   */
  private async refreshCacheAsync(key: string): Promise<void> {
    // Prevent multiple simultaneous refreshes for the same key
    if (this.refreshInProgress.has(key)) {
      logger.debug(`Refresh already in progress for key: ${key}`)
      return
    }

    const callback = this.refreshCallbacks.get(key)
    if (!callback) {
      logger.warn(`No refresh callback registered for key: ${key}`)
      return
    }

    this.refreshInProgress.add(key)

    try {
      logger.info(`Starting async cache refresh for key: ${key}`)

      // Execute refresh in background
      setImmediate(async () => {
        try {
          const startTime = Date.now()
          const data = await callback()
          const duration = Date.now() - startTime

          await this.set(key, data)

          logger.info(`Cache refreshed for key: ${key} in ${duration}ms`)
        } catch (error) {
          logger.error(`Error refreshing cache for key ${key}:`, error)
        } finally {
          this.refreshInProgress.delete(key)
        }
      })
    } catch (error) {
      logger.error(`Error initiating cache refresh for key ${key}:`, error)
      this.refreshInProgress.delete(key)
    }
  }

  /**
   * Get or set cache with automatic refresh
   */
  async getOrSet<T>(
    key: string,
    fetchCallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached) {
      return cached.data
    }

    // Fetch fresh data
    logger.info(`Fetching fresh data for key: ${key}`)
    const data = await fetchCallback()

    // Store in cache
    await this.set(key, data, ttl)

    return data
  }

  /**
   * Invalidate cache when trade data is updated
   */
  async invalidateOnTradeUpdate(): Promise<void> {
    logger.info('Invalidating cache due to trade update')

    // Bust all portfolio-related caches
    await this.bust([
      CacheKey.PORTFOLIO_HISTORY,
      CacheKey.PORTFOLIO_CURRENT,
      CacheKey.PORTFOLIO_COMPOSITION,
      CacheKey.TRADE_DATA
    ])

    this.emit(CacheEvent.TRADE_UPDATED)
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): any {
    const keys = this.cache.keys()
    const stats = {
      keys: keys.length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
      versions: Object.fromEntries(this.keyVersions),
      refreshInProgress: Array.from(this.refreshInProgress),
      ttl: CACHE_TTL_SECONDS
    }

    return stats
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.flushAll()
    this.keyVersions.clear()
    logger.info('Cache cleared')
  }

  /**
   * Get TTL for a specific key
   */
  getTTL(key: string): number | undefined {
    const versionedKey = this.getVersionedKey(key)
    return this.cache.getTtl(versionedKey)
  }

  /**
   * Set TTL for a specific key
   */
  setTTL(key: string, ttl: number): boolean {
    const versionedKey = this.getVersionedKey(key)
    return this.cache.ttl(versionedKey, ttl)
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const versionedKey = this.getVersionedKey(key)
    return this.cache.has(versionedKey)
  }

  // Private helper methods
  private getVersionedKey(key: string): string {
    const version = this.keyVersions.get(key) || 0
    return `${key}:v${version}`
  }

  private incrementVersion(key: string): number {
    const currentVersion = this.keyVersions.get(key) || 0
    const newVersion = currentVersion + 1
    this.keyVersions.set(key, newVersion)
    return newVersion
  }
}

// Create singleton instance
const cacheManager = new CacheManager()

// Export singleton instance and types
export default cacheManager
export { CacheManager, CacheOptions, CacheEntry }