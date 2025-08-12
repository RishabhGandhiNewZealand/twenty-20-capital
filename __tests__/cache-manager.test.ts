/**
 * Cache Manager Tests
 * 
 * Tests for cache storage, retrieval, TTL, and busting functionality
 */

import { CacheManager } from '@/lib/cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager
  
  beforeEach(() => {
    // Create a new cache manager instance for each test
    cacheManager = new CacheManager({ ttl: 2 }) // 2 seconds TTL for testing
  })
  
  afterEach(() => {
    // Clear cache after each test
    cacheManager.clear()
  })
  
  describe('Basic Operations', () => {
    it('should store and retrieve data from cache', async () => {
      const key = 'test:key'
      const data = { value: 'test data', count: 42 }
      
      // Store data
      const stored = await cacheManager.set(key, data)
      expect(stored).toBe(true)
      
      // Retrieve data
      const cached = await cacheManager.get(key)
      expect(cached).toBeDefined()
      expect(cached?.data).toEqual(data)
      expect(cached?.version).toBe(1)
    })
    
    it('should return undefined for non-existent keys', async () => {
      const cached = await cacheManager.get('non:existent')
      expect(cached).toBeUndefined()
    })
    
    it('should check if key exists', async () => {
      const key = 'test:exists'
      
      expect(cacheManager.has(key)).toBe(false)
      
      await cacheManager.set(key, { data: 'exists' })
      
      expect(cacheManager.has(key)).toBe(true)
    })
  })
  
  describe('TTL (Time To Live)', () => {
    it('should expire cache after TTL', async (done) => {
      const key = 'test:ttl'
      const data = { expires: 'soon' }
      
      // Store with 1 second TTL
      await cacheManager.set(key, data, 1)
      
      // Should exist immediately
      let cached = await cacheManager.get(key)
      expect(cached?.data).toEqual(data)
      
      // Wait for expiration
      setTimeout(async () => {
        cached = await cacheManager.get(key)
        expect(cached).toBeUndefined()
        done()
      }, 1500)
    })
    
    it('should update TTL for existing key', async () => {
      const key = 'test:update-ttl'
      await cacheManager.set(key, { data: 'ttl' })
      
      // Update TTL to 5 seconds
      const updated = cacheManager.setTTL(key, 5)
      expect(updated).toBe(true)
      
      const ttl = cacheManager.getTTL(key)
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(5)
    })
  })
  
  describe('Cache Versioning and Busting', () => {
    it('should increment version when busting cache', async () => {
      const key = 'test:version'
      const data1 = { version: 1 }
      const data2 = { version: 2 }
      
      // Set initial data
      await cacheManager.set(key, data1)
      let cached = await cacheManager.get(key)
      expect(cached?.version).toBe(1)
      expect(cached?.data).toEqual(data1)
      
      // Bust cache (increments version)
      await cacheManager.bust(key)
      
      // Old version should not be accessible
      cached = await cacheManager.get(key)
      expect(cached).toBeUndefined()
      
      // Set new data with new version
      await cacheManager.set(key, data2)
      cached = await cacheManager.get(key)
      expect(cached?.version).toBe(2)
      expect(cached?.data).toEqual(data2)
    })
    
    it('should bust multiple keys at once', async () => {
      const keys = ['test:multi1', 'test:multi2', 'test:multi3']
      
      // Set data for all keys
      for (const key of keys) {
        await cacheManager.set(key, { key })
      }
      
      // Verify all exist
      for (const key of keys) {
        expect(cacheManager.has(key)).toBe(true)
      }
      
      // Bust all keys
      await cacheManager.bust(keys)
      
      // Verify all are busted (new version, no data)
      for (const key of keys) {
        const cached = await cacheManager.get(key)
        expect(cached).toBeUndefined()
      }
    })
  })
  
  describe('getOrSet Pattern', () => {
    it('should fetch and cache data if not present', async () => {
      const key = 'test:getOrSet'
      const fetchData = jest.fn().mockResolvedValue({ fetched: 'data' })
      
      // First call should fetch
      const data1 = await cacheManager.getOrSet(key, fetchData)
      expect(data1).toEqual({ fetched: 'data' })
      expect(fetchData).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const data2 = await cacheManager.getOrSet(key, fetchData)
      expect(data2).toEqual({ fetched: 'data' })
      expect(fetchData).toHaveBeenCalledTimes(1) // Not called again
    })
    
    it('should respect TTL in getOrSet', async (done) => {
      const key = 'test:getOrSet:ttl'
      let callCount = 0
      const fetchData = jest.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({ call: callCount })
      })
      
      // First call with 1 second TTL
      const data1 = await cacheManager.getOrSet(key, fetchData, 1)
      expect(data1).toEqual({ call: 1 })
      
      // Wait for expiration
      setTimeout(async () => {
        // Should fetch again after expiration
        const data2 = await cacheManager.getOrSet(key, fetchData, 1)
        expect(data2).toEqual({ call: 2 })
        expect(fetchData).toHaveBeenCalledTimes(2)
        done()
      }, 1500)
    })
  })
  
  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      // Initial stats
      let stats = cacheManager.getStats()
      expect(stats.keys).toBe(0)
      
      // Add some data
      await cacheManager.set('stat:1', { data: 1 })
      await cacheManager.set('stat:2', { data: 2 })
      
      // Get data (hits)
      await cacheManager.get('stat:1')
      await cacheManager.get('stat:2')
      
      // Miss
      await cacheManager.get('stat:missing')
      
      stats = cacheManager.getStats()
      expect(stats.keys).toBe(2)
      expect(stats.hits).toBeGreaterThanOrEqual(2)
      expect(stats.misses).toBeGreaterThanOrEqual(1)
    })
  })
  
  describe('Cache Clear', () => {
    it('should clear all cache entries', async () => {
      // Add multiple entries
      await cacheManager.set('clear:1', { data: 1 })
      await cacheManager.set('clear:2', { data: 2 })
      await cacheManager.set('clear:3', { data: 3 })
      
      let stats = cacheManager.getStats()
      expect(stats.keys).toBe(3)
      
      // Clear all
      await cacheManager.clear()
      
      stats = cacheManager.getStats()
      expect(stats.keys).toBe(0)
      
      // Verify entries are gone
      expect(await cacheManager.get('clear:1')).toBeUndefined()
      expect(await cacheManager.get('clear:2')).toBeUndefined()
      expect(await cacheManager.get('clear:3')).toBeUndefined()
    })
  })
  
  describe('Event Emissions', () => {
    it('should emit events on cache operations', async (done) => {
      const key = 'test:events'
      let refreshedEmitted = false
      let bustedEmitted = false
      
      // Listen for events
      cacheManager.on('cache:refreshed', (data) => {
        expect(data.key).toBe(key)
        expect(data.version).toBe(1)
        refreshedEmitted = true
      })
      
      cacheManager.on('cache:busted', (data) => {
        expect(data.key).toBe(key)
        expect(data.oldVersion).toBe(1)
        expect(data.newVersion).toBe(2)
        bustedEmitted = true
        
        // Check both events were emitted
        expect(refreshedEmitted).toBe(true)
        expect(bustedEmitted).toBe(true)
        done()
      })
      
      // Trigger events
      await cacheManager.set(key, { data: 'test' })
      await cacheManager.bust(key)
    })
  })
})