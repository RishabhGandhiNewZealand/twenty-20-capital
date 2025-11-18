import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { CACHE_REVALIDATE } from '@/lib/constants'
import { guardAdminRoute } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return guardAdminRoute(request, async () => {
    try {
      const { symbol } = await params
      
      if (!symbol) {
        return NextResponse.json(
          { error: 'Stock symbol is required' },
          { status: 400 }
        )
      }

      // Yahoo Finance API endpoint for quote data
      const yahooFinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`
      
      const response = await fetch(yahooFinanceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        // Cache to avoid excessive API calls
        next: { revalidate: CACHE_REVALIDATE.STOCK_PRICE }
      })

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.chart?.result?.[0]?.meta) {
        return NextResponse.json(
          { error: 'Invalid stock symbol or no data available' },
          { status: 404 }
        )
      }

      const meta = data.chart.result[0].meta
      const currentPrice = meta.regularMarketPrice || meta.previousClose
      const currency = meta.currency || 'USD'
      const longName = meta.longName || symbol.toUpperCase()
      const exchangeName = meta.exchangeName || 'Unknown'

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        currentPrice,
        currency,
        longName,
        exchangeName,
        lastUpdated: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Error fetching stock price:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stock price' },
        { status: 500 }
      )
    }
  })
} 