import { NextRequest, NextResponse } from 'next/server'
import { testCompanyURLs, getSupportedSymbols } from '@/lib/dynamic-earnings-scraper'

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
          successRate: result.totalUrls > 0 ? Math.round((result.validUrls / result.totalUrls) * 100) : 0
        }
      })
    } else {
      // Test all supported companies
      const supportedSymbols = await getSupportedSymbols()
      const results = []
      
      for (const testSymbol of supportedSymbols) {
        try {
          const result = await testCompanyURLs(testSymbol)
          results.push(result)
        } catch (error) {
          console.error(`Error testing ${testSymbol}:`, error)
          results.push({
            symbol: testSymbol,
            validUrls: 0,
            totalUrls: 0,
            urls: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      const totalValid = results.reduce((sum, r) => sum + r.validUrls, 0)
      const totalUrls = results.reduce((sum, r) => sum + r.totalUrls, 0)
      
      return NextResponse.json({
        success: true,
        data: results,
        summary: {
          totalCompanies: results.length,
          totalValidUrls: totalValid,
          totalUrls: totalUrls,
          overallSuccessRate: totalUrls > 0 ? Math.round((totalValid / totalUrls) * 100) : 0,
          supportedSymbols
        }
      })
    }
  } catch (error) {
    console.error('Error testing earnings URLs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test earnings URLs' },
      { status: 500 }
    )
  }
}