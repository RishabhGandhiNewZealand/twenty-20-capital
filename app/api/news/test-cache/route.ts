import { NextResponse } from 'next/server'
import { newsCache } from '@/lib/news-cache'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Initialize cache
    await newsCache.initialize()
    
    // Test data
    const testCompany = 'Test Company Manual'
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    const testData = {
      company_name: testCompany,
      status: 'news_found' as const,
      summary_points: [
        '• Manual test news item 1',
        '• Manual test news item 2'
      ],
      references: [{
        title: 'Manual Test Article',
        source_name: 'Manual Test Source',
        url: 'https://example.com/manual',
        publication_date: '2024-01-15',
        relevance: 'direct' as const
      }]
    }
    
    // Try to save to cache
    logger.info('Starting manual cache test...')
    await newsCache.set(testCompany, startDate, endDate, testData)
    
    // Try to retrieve from cache
    const cached = await newsCache.get(testCompany, startDate, endDate)
    
    // Get stats
    const stats = await newsCache.getStats()
    
    return NextResponse.json({
      message: 'Cache test completed',
      testCompany,
      dataSaved: testData,
      dataRetrieved: cached,
      cacheStats: stats,
      success: cached !== null && cached.company_name === testCompany
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