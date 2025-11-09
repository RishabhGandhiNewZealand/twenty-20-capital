import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Yahoo Finance API search endpoint
 * Searches for companies by ticker symbol
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }
    
    // Use Yahoo Finance API v10 for search
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
    
    logger.info(`Searching Yahoo Finance for: ${query}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract and format the quotes
    const quotes = data.quotes?.map((quote: any) => ({
      symbol: quote.symbol,
      shortname: quote.shortname || quote.longname,
      longname: quote.longname,
      exchange: quote.exchDisp || quote.exchange,
      quoteType: quote.quoteType,
      sector: quote.sector,
      industry: quote.industry
    })) || []
    
    logger.info(`Found ${quotes.length} results for: ${query}`)
    
    return NextResponse.json({
      quotes,
      count: quotes.length
    })
    
  } catch (error) {
    logger.error('Error searching Yahoo Finance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to search Yahoo Finance', details: errorMessage },
      { status: 500 }
    )
  }
}
