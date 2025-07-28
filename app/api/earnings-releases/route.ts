import { NextRequest, NextResponse } from 'next/server'
import { scrapeEarningsReleases, getSupportedSymbols } from '@/lib/earnings-scraper'

interface EarningsRelease {
  title: string
  date: string
  quarter: string
  year: string
  url: string
  type: 'earnings_release' | 'press_release' | 'presentation'
  company: string
  symbol: string
  fileType: string
  source: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  const quarter = searchParams.get('quarter')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    const releases: EarningsRelease[] = []

    // Check if we support this symbol
    const supportedSymbols = getSupportedSymbols()
    
    if (supportedSymbols.includes(symbol)) {
      // Use real scraper for supported companies
      try {
        const scraperResults = await scrapeEarningsReleases(symbol, year, quarter)
        
        for (const result of scraperResults) {
          releases.push({
            title: result.title,
            date: result.date,
            quarter: result.quarter,
            year: result.year,
            url: result.url,
            type: 'earnings_release',
            company: result.title.split(' ')[0] + ' Inc.', // Extract company name from title
            symbol,
            fileType: 'PDF',
            source: result.isValid ? 'Verified Company URL' : 'Predicted Pattern'
          })
        }
      } catch (error) {
        console.error(`Error scraping ${symbol}:`, error)
      }
    } else {
      // Fallback for unsupported companies
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        releases.push({
          title: `${symbol} ${q} ${year} Earnings Release`,
          date: getQuarterDate(q, parseInt(year)),
          quarter: q,
          year,
          url: `https://example-ir.com/${symbol.toLowerCase()}/${year}-${q.toLowerCase()}-earnings.pdf`,
          type: 'earnings_release',
          company: `${symbol} Inc.`,
          symbol,
          fileType: 'PDF',
          source: 'Unsupported Company - Demo Pattern'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: releases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      count: releases.length,
      supportedSymbols,
      isSupported: supportedSymbols.includes(symbol)
    })

  } catch (error) {
    console.error('Error fetching earnings releases:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings releases' },
      { status: 500 }
    )
  }
}

function getQuarterDate(quarter: string, year: number): string {
  const quarterDates = {
    'Q1': `${year}-03-31`,
    'Q2': `${year}-06-30`, 
    'Q3': `${year}-09-30`,
    'Q4': `${year}-12-31`
  }
  return quarterDates[quarter as keyof typeof quarterDates] || `${year}-12-31`
}