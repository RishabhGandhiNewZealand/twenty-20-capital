import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Yahoo Finance API quote endpoint
 * Gets detailed financial data for a specific ticker
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Query parameter "symbol" is required' },
        { status: 400 }
      )
    }
    
    // Get quote summary data
    const quoteUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,financialData,defaultKeyStatistics,incomeStatementHistory,incomeStatementHistoryQuarterly,price`
    
    logger.info(`Fetching Yahoo Finance data for: ${symbol}`)
    
    const response = await fetch(quoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status}`)
    }
    
    const data = await response.json()
    const result = data.quoteSummary?.result?.[0]
    
    if (!result) {
      return NextResponse.json(
        { error: 'No data found for symbol' },
        { status: 404 }
      )
    }
    
    // Extract key financial metrics
    const price = result.price
    const summaryDetail = result.summaryDetail
    const financialData = result.financialData
    const keyStats = result.defaultKeyStatistics
    const incomeStatement = result.incomeStatementHistory?.incomeStatementHistory?.[0]
    
    // Calculate TTM revenue from the most recent income statement
    const ttmRevenue = incomeStatement?.totalRevenue?.raw || null
    const marketCap = price?.marketCap?.raw || summaryDetail?.marketCap?.raw || null
    const currentPrice = price?.regularMarketPrice?.raw || summaryDetail?.previousClose?.raw || null
    
    const companyData = {
      symbol: symbol.toUpperCase(),
      shortName: price?.shortName || '',
      longName: price?.longName || '',
      currency: price?.currency || 'USD',
      exchange: price?.exchangeName || '',
      
      // Key metrics
      currentPrice,
      marketCap,
      ttmRevenue,
      
      // Additional useful data
      enterpriseValue: keyStats?.enterpriseValue?.raw || null,
      trailingPE: summaryDetail?.trailingPE?.raw || null,
      forwardPE: summaryDetail?.forwardPE?.raw || null,
      priceToBook: keyStats?.priceToBook?.raw || null,
      revenuePerShare: keyStats?.revenuePerShare?.raw || null,
      profitMargins: financialData?.profitMargins?.raw || null,
      operatingMargins: financialData?.operatingMargins?.raw || null,
      ebitda: financialData?.ebitda?.raw || null,
      totalCash: financialData?.totalCash?.raw || null,
      totalDebt: financialData?.totalDebt?.raw || null,
      freeCashflow: financialData?.freeCashflow?.raw || null,
      revenueGrowth: financialData?.revenueGrowth?.raw || null,
      earningsGrowth: financialData?.earningsGrowth?.raw || null,
    }
    
    logger.info(`Successfully fetched data for ${symbol}`)
    
    return NextResponse.json(companyData)
    
  } catch (error) {
    logger.error('Error fetching Yahoo Finance quote:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch quote data', details: errorMessage },
      { status: 500 }
    )
  }
}
