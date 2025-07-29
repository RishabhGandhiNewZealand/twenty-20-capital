import { NextRequest, NextResponse } from 'next/server'
import { getInvestorRelationsUrl } from '@/lib/investor-relations-urls'
import { getCachedInvestorReports } from '@/lib/investor-reports-scraper'
import { generateRecentReports } from '@/lib/investor-reports-patterns'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    )
  }
  
  try {
    // Get investor relations URL - this will always return something now
    const irUrl = getInvestorRelationsUrl(symbol)
    
    // Try to scrape reports dynamically
    let scrapedReports = await getCachedInvestorReports(symbol)
    
    // Check if we found any reports through scraping
    const hasScrapedReports = scrapedReports.quarterly.length > 0 || scrapedReports.annual.length > 0
    
    // If scraping didn't work, try pattern-based generation
    if (!hasScrapedReports) {
      const generatedReports = generateRecentReports(symbol)
      if (generatedReports.quarterly.length > 0 || generatedReports.annual.length > 0) {
        scrapedReports = generatedReports
      }
    }
    
    // Check if we have any reports now
    const hasReports = scrapedReports.quarterly.length > 0 || scrapedReports.annual.length > 0
    
    return NextResponse.json({
      symbol,
      investorRelationsUrl: irUrl,
      reports: scrapedReports,
      message: hasReports 
        ? undefined 
        : 'Unable to automatically retrieve reports. Please visit the investor relations page to access financial reports.',
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching investor reports:', error)
    
    // Return graceful fallback
    const irUrl = getInvestorRelationsUrl(symbol)
    
    // Try pattern-based generation as last resort
    const generatedReports = generateRecentReports(symbol)
    
    return NextResponse.json({
      symbol,
      investorRelationsUrl: irUrl,
      reports: generatedReports.quarterly.length > 0 || generatedReports.annual.length > 0 
        ? generatedReports 
        : { quarterly: [], annual: [] },
      message: generatedReports.quarterly.length === 0 && generatedReports.annual.length === 0
        ? 'Unable to retrieve reports at this time. Please visit the investor relations page.'
        : undefined,
      lastUpdated: new Date().toISOString()
    })
  }
}