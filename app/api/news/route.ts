import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { MIN_SHARE_THRESHOLD } from '@/lib/constants'
import { getCachedNewsAnalysis } from '@/lib/news-analysis-cache'
import { CACHE_HEADERS } from '@/lib/cache-config'
import { guardAdminRoute } from '@/lib/admin-auth'

// Fetch unique company names from portfolio data
async function getPortfolioCompanies(): Promise<string[]> {
  try {
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      // Return fallback list
      return [
        "Microsoft",
        "Tesla", 
        "Fonterra Co-operative Group",
        "Fletcher Building",
        "Meta Platforms",
        "Salesforce",
        "Alphabet",
        "Amazon",
        "Mainfreight"
      ]
    }
    
    // Get all unique companies that have ever been traded (current and historical)
    const companies = new Set<string>()
    
    // Process all trades to get unique company names
    for (const trade of trades) {
      if (trade.name) {
        companies.add(trade.name)
      }
    }
    
    const companyList = Array.from(companies)
    logger.info(`Found ${companyList.length} unique companies (current and historical)`)
    
    return companyList.length > 0 ? companyList : [
      // Fallback list if no companies found
      "Microsoft",
      "Tesla", 
      "Fonterra Co-operative Group",
      "Fletcher Building",
      "Meta Platforms",
      "Salesforce",
      "Alphabet",
      "Amazon",
      "Mainfreight"
    ]
  } catch (error) {
    logger.error('Error fetching portfolio companies:', error)
    // Return a fallback list if data fetch fails
    return [
      "Microsoft",
      "Tesla", 
      "Fonterra Co-operative Group",
      "Fletcher Building",
      "Meta Platforms",
      "Salesforce",
      "Alphabet",
      "Amazon",
      "Mainfreight"
    ]
  }
}

// Extend the timeout for this route (max 300s on Hobby plan)
export const maxDuration = 300 // 5 minutes timeout

export async function GET(request: NextRequest) {
  return guardAdminRoute(request, async () => {
    try {
      // Check if Gemini API key is configured
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        logger.error('GEMINI_API_KEY environment variable is not configured')
        return NextResponse.json(
          { error: 'News service not configured. Please set GEMINI_API_KEY.' },
          { status: 500 }
        )
      }

      // Get portfolio companies
      const portfolioCompanies = await getPortfolioCompanies()
      logger.info(`Found ${portfolioCompanies.length} portfolio companies`)

      // Calculate date range
      const currentDate = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      logger.info(`Analysis period: ${startDateStr} to ${endDateStr}`)

      // Use cached news analysis
      const newsData = await getCachedNewsAnalysis(
        portfolioCompanies,
        startDateStr,
        endDateStr,
        currentDate,
        apiKey
      )

      // Return with appropriate cache headers
      return NextResponse.json(newsData, {
        headers: CACHE_HEADERS.EXPENSIVE_API
      })

    } catch (error: any) {
      logger.error('Unexpected error in news API:', error)
      return NextResponse.json(
        { error: `Failed to fetch news data: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  })
}