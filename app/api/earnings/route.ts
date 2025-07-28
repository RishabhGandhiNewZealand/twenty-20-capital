import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { scrapeEarningsData } from '@/lib/earnings-scraper'
import { getEarningsFromYahoo } from '@/lib/earnings-yahoo'
import { getEnhancedEarningsData } from '@/lib/earnings-data-enhanced'
import { parseCSVData } from '@/lib/portfolio'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'

// Static generation - data fetched at build time only
export const dynamic = 'force-static'
export const revalidate = false

// Try to use enhanced scraper if available
let scrapeEarningsDataEnhanced: typeof scrapeEarningsData | null = null
try {
  const enhancedModule = require('@/lib/earnings-scraper-enhanced')
  scrapeEarningsDataEnhanced = enhancedModule.scrapeEarningsDataEnhanced
} catch (e) {
  logger.warn('Enhanced scraper not available, using basic scraper')
}

export async function GET() {
  try {
    // Check for cached data first (useful during build)
    try {
      const fs = require('fs').promises
      const path = require('path')
      const cacheFile = path.join(process.cwd(), '.cache', 'earnings-data.json')
      const cached = await fs.readFile(cacheFile, 'utf-8')
      const cachedData = JSON.parse(cached)
      
      // Always return cached data if it exists (build-time only)
      logger.info('Returning cached earnings data from build')
      return NextResponse.json(cachedData)
    } catch (e) {
      // Cache miss or error, continue with fresh fetch
      logger.info('Cache miss or error, fetching fresh data')
    }
    
    // Get current portfolio holdings
    const csvData = await downloadTradeDataFromBlob()
    if (!csvData) {
      return NextResponse.json(
        { error: 'Portfolio data source not configured' },
        { status: 500 }
      )
    }

    const trades = parseCSVData(csvData)
    
    // Get unique symbols from current holdings
    const holdingsBySymbol = new Map<string, { shares: number, name: string }>()
    
    trades.forEach(trade => {
      const current = holdingsBySymbol.get(trade.code) || { shares: 0, name: trade.name }
      
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        current.shares += trade.qty
      } else if (trade.type === 'Sell') {
        current.shares -= trade.qty
      }
      
      if (current.shares > 0.01) {
        holdingsBySymbol.set(trade.code, current)
      } else {
        holdingsBySymbol.delete(trade.code)
      }
    })
    
    // Get earnings data for each holding
    const symbols = Array.from(holdingsBySymbol.keys())
    const names = Array.from(holdingsBySymbol.values()).map(h => h.name)
    
    // Use enhanced earnings data as primary source
    let earningsData
    try {
      earningsData = await getEnhancedEarningsData(symbols, names)
    } catch (error) {
      logger.error('Enhanced earnings data failed, trying Yahoo Finance:', error)
      try {
        earningsData = await getEarningsFromYahoo(symbols, names)
      } catch (yahooError) {
        logger.error('Yahoo Finance failed, trying web scraper:', yahooError)
        // Fall back to web scraper if both fail
        const scraper = scrapeEarningsDataEnhanced || scrapeEarningsData
        earningsData = await scraper(symbols, names)
      }
    }
    
    // Cache the data for future use
    try {
      const fs = require('fs').promises
      const path = require('path')
      const cacheDir = path.join(process.cwd(), '.cache')
      await fs.mkdir(cacheDir, { recursive: true })
      
      const dataToCache = {
        ...earningsData,
        lastUpdated: new Date().toISOString()
      }
      
      await fs.writeFile(
        path.join(cacheDir, 'earnings-data.json'),
        JSON.stringify(dataToCache, null, 2)
      )
      logger.info('Cached earnings data successfully')
    } catch (cacheError) {
      logger.warn('Failed to cache earnings data:', cacheError)
    }
    
    return NextResponse.json({
      ...earningsData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error fetching earnings data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch earnings data',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}