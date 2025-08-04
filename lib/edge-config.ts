import { get } from '@vercel/edge-config'
import { logger } from './logger'

interface CachedNewsData {
  data: any
  timestamp: string
  dateRange: {
    start: string
    end: string
  }
}

/**
 * Generate a cache key for a company's news data
 */
export function getNewsCacheKey(companyName: string, startDate: string, endDate: string): string {
  // Normalize company name to avoid cache misses due to casing/spacing
  const normalizedCompany = companyName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  return `news_${normalizedCompany}_${startDate}_${endDate}`
}

/**
 * Get cached news data for a company
 */
export async function getCachedNewsData(
  companyName: string, 
  startDate: string, 
  endDate: string
): Promise<any | null> {
  try {
    const cacheKey = getNewsCacheKey(companyName, startDate, endDate)
    const cached = await get<CachedNewsData>(cacheKey)
    
    if (!cached) {
      logger.info(`Cache miss for ${companyName}`)
      return null
    }
    
    // Check if the cached data is for the same date range
    if (cached.dateRange.start !== startDate || cached.dateRange.end !== endDate) {
      logger.info(`Cache date range mismatch for ${companyName}`)
      return null
    }
    
    logger.info(`Cache hit for ${companyName} (cached at ${cached.timestamp})`)
    return cached.data
  } catch (error) {
    logger.error(`Error reading from Edge Config for ${companyName}:`, error)
    return null
  }
}

/**
 * Store news data in cache
 * Note: Edge Config is read-only at runtime. Updates must be done via API.
 * This function prepares the data structure for manual updates.
 */
export function prepareCacheData(
  companyName: string,
  startDate: string,
  endDate: string,
  data: any
): { key: string; value: CachedNewsData } {
  const cacheKey = getNewsCacheKey(companyName, startDate, endDate)
  const cacheValue: CachedNewsData = {
    data,
    timestamp: new Date().toISOString(),
    dateRange: {
      start: startDate,
      end: endDate
    }
  }
  
  logger.info(`Prepared cache data for ${companyName} with key: ${cacheKey}`)
  
  return { key: cacheKey, value: cacheValue }
}

/**
 * Check if Edge Config is available
 */
export function isEdgeConfigAvailable(): boolean {
  return !!process.env.EDGE_CONFIG
}