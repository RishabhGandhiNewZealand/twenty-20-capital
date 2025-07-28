import { NextRequest, NextResponse } from 'next/server'
import { scrapePortfolioEarnings, getSupportedSymbols, testCompanyURLs } from '@/lib/dynamic-earnings-scraper'

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
    const supportedSymbols = await getSupportedSymbols()
    
    if (supportedSymbols.includes(symbol)) {
      try {
        // Use the dynamic scraper to get real earnings data
        const companyData = await testCompanyURLs(symbol)
        
        for (const earningsURL of companyData.urls) {
          if (!quarter || earningsURL.quarter === quarter) {
            releases.push({
              title: earningsURL.title,
              date: earningsURL.date,
              quarter: earningsURL.quarter,
              year: earningsURL.year,
              url: earningsURL.url,
              type: 'earnings_release',
              company: earningsURL.title.split(' ')[0] + ' Inc.',
              symbol,
              fileType: 'PDF',
              source: earningsURL.isValid ? 'Verified Company URL' : 'Predicted Pattern'
            })
          }
        }
        
        // If no URLs found for the specific year/quarter, try other years
        if (releases.length === 0) {
          const years = ['2024', '2023', '2022']
          for (const testYear of years) {
            if (testYear !== year) {
              const testData = await testCompanyURLs(symbol)
              for (const earningsURL of testData.urls) {
                if (!quarter || earningsURL.quarter === quarter) {
                  releases.push({
                    title: earningsURL.title.replace(earningsURL.year, testYear),
                    date: earningsURL.date.replace(earningsURL.year, testYear),
                    quarter: earningsURL.quarter,
                    year: testYear,
                    url: earningsURL.url.replace(earningsURL.year, testYear),
                    type: 'earnings_release',
                    company: earningsURL.title.split(' ')[0] + ' Inc.',
                    symbol,
                    fileType: 'PDF',
                    source: 'Historical Pattern Match'
                  })
                }
              }
              if (releases.length > 0) break
            }
          }
        }
        
      } catch (error) {
        console.error(`Error scraping ${symbol}:`, error)
      }
    } else {
      // For unsupported companies, return a message indicating they need to be added
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        releases.push({
          title: `${symbol} ${q} ${year} Earnings Release - Not Yet Supported`,
          date: getQuarterDate(q, parseInt(year)),
          quarter: q,
          year,
          url: `https://investor.${symbol.toLowerCase()}.com/earnings/${year}-${q.toLowerCase()}-earnings.pdf`,
          type: 'earnings_release',
          company: `${symbol} Inc.`,
          symbol,
          fileType: 'PDF',
          source: 'Unsupported Company - Add to Scraper'
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