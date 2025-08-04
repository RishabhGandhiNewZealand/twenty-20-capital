import { NextResponse } from 'next/server'
import { newsCache } from '@/lib/news-cache'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario = searchParams.get('scenario') || 'success'
    
    // Initialize cache
    await newsCache.initialize()
    
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    
    let testData: any
    let testCompany: string
    
    // Different test scenarios
    switch (scenario) {
      case 'success':
        testCompany = 'Test Company Success'
        testData = {
          company_name: testCompany,
          status: 'news_found',
          summary_points: [
            '• Test news item 1',
            '• Test news item 2'
          ],
          references: [{
            title: 'Test Article',
            source_name: 'Test Source',
            url: 'https://example.com',
            publication_date: '2024-01-15',
            relevance: 'direct'
          }]
        }
        break
        
      case 'no_news':
        testCompany = 'Test Company No News'
        testData = {
          company_name: testCompany,
          status: 'no_significant_news_found',
          summary_points: [],
          references: []
        }
        break
        
      case 'error':
        testCompany = 'Test Company Error'
        testData = {
          company_name: testCompany,
          status: 'no_significant_news_found',
          summary_points: [],
          references: [],
          error: 'Test error message'
        }
        break
        
      case 'empty_data':
        testCompany = 'Test Company Empty'
        testData = {
          company_name: testCompany,
          status: 'news_found',
          summary_points: [],
          references: []
        }
        break
        
      default:
        return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }
    
    // Test the caching logic (same as in the API route)
    const shouldCache = testData && 
                       testData.status === 'news_found' && 
                       !testData.error &&
                       testData.summary_points && 
                       testData.summary_points.length > 0 &&
                       testData.references &&
                       testData.references.length > 0
    
    let cacheResult = null
    if (shouldCache) {
      logger.info(`Test: Will cache ${testCompany}`)
      await newsCache.set(testCompany, startDate, endDate, testData)
      cacheResult = 'cached'
    } else {
      const reasons = []
      if (!testData) reasons.push('no result')
      if (testData?.status !== 'news_found') reasons.push(`status: ${testData?.status}`)
      if (testData?.error) reasons.push('has error')
      if (!testData?.summary_points?.length) reasons.push('no summaries')
      if (!testData?.references?.length) reasons.push('no references')
      
      logger.info(`Test: Skipping cache for ${testCompany} - Reasons: ${reasons.join(', ')}`)
      cacheResult = `skipped - ${reasons.join(', ')}`
    }
    
    // Try to retrieve from cache
    const cached = await newsCache.get(testCompany, startDate, endDate)
    
    // Get stats
    const stats = await newsCache.getStats()
    
    return NextResponse.json({
      scenario,
      testCompany,
      testData,
      shouldCache,
      cacheResult,
      retrievedFromCache: cached,
      cacheStats: stats,
      success: shouldCache ? (cached !== null) : (cached === null)
    })
    
  } catch (error: any) {
    logger.error('Manual cache test failed:', error)
    return NextResponse.json(
      { 
        error: 'Cache test failed', 
        message: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}