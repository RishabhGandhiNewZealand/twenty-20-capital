import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { scrapeEarningsData } from '@/lib/earnings-scraper'
import { getEarningsFromYahoo } from '@/lib/earnings-yahoo'
import { parseCSVData } from '@/lib/portfolio'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

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
      
      // If cache is less than 1 hour old, return it
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime()
      if (cacheAge < 3600000) {
        logger.info('Returning cached earnings data')
        return NextResponse.json(cachedData)
      }
    } catch (e) {
      // Cache miss or error, continue with fresh fetch
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
    
    // Use Yahoo Finance as primary source (most reliable)
    let earningsData
    try {
      earningsData = await getEarningsFromYahoo(symbols, names)
    } catch (error) {
      logger.error('Yahoo Finance failed, trying web scraper:', error)
      // Fall back to web scraper if Yahoo fails
      const scraper = scrapeEarningsDataEnhanced || scrapeEarningsData
      earningsData = await scraper(symbols, names)
    }
    
    return NextResponse.json({
      ...earningsData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error fetching earnings data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}