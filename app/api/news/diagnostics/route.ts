import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { newsCache } from '@/lib/news-cache'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { isDatabaseConfigured } from '@/lib/db'

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      },
      configuration: {
        geminiApiKey: !!process.env.GEMINI_API_KEY,
        databaseUrl: !!process.env.DATABASE_URL,
        cachePopulateSecret: !!process.env.CACHE_POPULATE_SECRET,
        cronSecret: !!process.env.CRON_SECRET,
        isDatabaseConfigured: isDatabaseConfigured()
      },
      cache: {
        initialized: false,
        stats: null,
        error: null
      },
      portfolio: {
        companies: [],
        error: null
      }
    }
    
    // Test cache
    try {
      await newsCache.initialize()
      diagnostics.cache.initialized = true
      diagnostics.cache.stats = await newsCache.getStats()
      
      // Check a sample cache entry
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Get portfolio companies
      const { holdings, exitedPositions } = await generatePortfolioData()
      const companies = new Set<string>()
      
      holdings.forEach(h => {
        if (h.name && h.symbol) {
          companies.add(`${h.name} (${h.symbol})`)
        }
      })
      
      exitedPositions.forEach(p => {
        if (p.name && p.symbol) {
          companies.add(`${p.name} (${p.symbol})`)
        }
      })
      
      diagnostics.portfolio.companies = Array.from(companies)
      
      // Check cache for first company
      if (diagnostics.portfolio.companies.length > 0) {
        const firstCompany = diagnostics.portfolio.companies[0]
        const cachedData = await newsCache.get(firstCompany, startDateStr, endDateStr)
        diagnostics.cache.sampleCheck = {
          company: firstCompany,
          hasCachedData: !!cachedData,
          dateRange: `${startDateStr} to ${endDateStr}`
        }
      }
      
    } catch (error: any) {
      diagnostics.cache.error = error.message
      logger.error('Cache diagnostics error:', error)
    }
    
    // Add recommendations
    diagnostics.recommendations = []
    
    if (!diagnostics.configuration.geminiApiKey) {
      diagnostics.recommendations.push('Set GEMINI_API_KEY environment variable')
    }
    
    if (!diagnostics.configuration.databaseUrl) {
      diagnostics.recommendations.push('Set DATABASE_URL environment variable')
    }
    
    if (!diagnostics.configuration.cachePopulateSecret) {
      diagnostics.recommendations.push('Set CACHE_POPULATE_SECRET for security')
    }
    
    if (!diagnostics.configuration.cronSecret) {
      diagnostics.recommendations.push('Set CRON_SECRET for Vercel cron jobs')
    }
    
    if (diagnostics.cache.stats?.totalEntries === 0) {
      diagnostics.recommendations.push('No cache entries found - run cache population')
    }
    
    // URLs for testing
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
      
    diagnostics.testUrls = {
      testGemini: `${baseUrl}/api/news/test-gemini`,
      populateCache: `${baseUrl}/api/news/populate-cache (POST with auth)`,
      cacheStatus: `${baseUrl}/api/news/populate-cache (GET)`,
      cronJob: `${baseUrl}/api/cron/populate-news-cache`
    }
    
    return NextResponse.json(diagnostics)
    
  } catch (error: any) {
    logger.error('Diagnostics error:', error)
    return NextResponse.json({
      error: 'Diagnostics failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}