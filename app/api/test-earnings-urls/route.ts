import { NextRequest, NextResponse } from 'next/server'
import { testCompanyURLs, getSupportedSymbols } from '@/lib/earnings-scraper'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()

  try {
    if (symbol) {
      // Test specific company
      const result = await testCompanyURLs(symbol)
      return NextResponse.json({
        success: true,
        data: result,
        summary: {
          symbol: result.symbol,
          validUrls: result.validUrls,
          totalUrls: result.totalUrls,
          successRate: Math.round((result.validUrls / result.totalUrls) * 100)
        }
      })
    } else {
      // Test all supported companies
      const supportedSymbols = getSupportedSymbols()
      const results = []
      let totalValid = 0
      let totalUrls = 0

      for (const companySymbol of supportedSymbols) {
        try {
          const result = await testCompanyURLs(companySymbol)
          results.push(result)
          totalValid += result.validUrls
          totalUrls += result.totalUrls
          
          // Add delay to be respectful to servers
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Error testing ${companySymbol}:`, error)
          results.push({
            symbol: companySymbol,
            validUrls: 0,
            totalUrls: 0,
            results: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: results,
        summary: {
          totalCompanies: supportedSymbols.length,
          totalUrls,
          totalValid,
          overallSuccessRate: Math.round((totalValid / totalUrls) * 100),
          companiesWithValidUrls: results.filter(r => r.validUrls > 0).length,
          companyBreakdown: results.map(r => ({
            symbol: r.symbol,
            validUrls: r.validUrls,
            totalUrls: r.totalUrls,
            successRate: r.totalUrls > 0 ? Math.round((r.validUrls / r.totalUrls) * 100) : 0
          }))
        }
      })
    }
  } catch (error) {
    console.error('Error testing earnings URLs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test earnings URLs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}