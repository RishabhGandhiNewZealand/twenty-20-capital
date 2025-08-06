import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { newsCache } from '@/lib/news-cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company parameter is required' },
        { status: 400 }
      )
    }
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Initialize cache
    await newsCache.initialize()
    
    // Only read from cache - never call Gemini
    const cachedResult = await newsCache.get(company, startDateStr, endDateStr)
    
    if (cachedResult) {
      logger.info(`Returning cached result for ${company}`)
      return NextResponse.json(cachedResult)
    } else {
      // Return empty result if no cache exists
      logger.info(`No cached news found for ${company}`)
      return NextResponse.json({
        company_name: company,
        status: "no_significant_news_found",
        summary_points: [],
        references: [],
        message: "No cached news available. Please wait for the next cache update."
      })
    }

  } catch (error: any) {
    logger.error('Error fetching company news from cache:', error)
    return NextResponse.json(
      { error: `Failed to fetch news: ${error.message}` },
      { status: 500 }
    )
  }
}