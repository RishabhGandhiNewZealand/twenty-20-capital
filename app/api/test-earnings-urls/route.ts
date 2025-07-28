import { NextRequest, NextResponse } from 'next/server'
import { testCompanyURLs, getSupportedSymbols } from '@/lib/earnings-scraper'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    if (symbol) {
      // Test single company
      const result = await testCompanyURLs(symbol.toUpperCase(), year)
      return NextResponse.json({
        success: true,
        ...result
      })
    } else {
      // Test all supported companies
      const supportedSymbols = getSupportedSymbols()
      const results = []
      
      for (const testSymbol of supportedSymbols) {
        try {
          const result = await testCompanyURLs(testSymbol, year)
          results.push(result)
        } catch (error) {
          results.push({
            symbol: testSymbol,
            totalUrls: 0,
            validUrls: 0,
            results: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // Calculate summary statistics
      const totalUrls = results.reduce((sum, r) => sum + r.totalUrls, 0)
      const totalValid = results.reduce((sum, r) => sum + r.validUrls, 0)
      const overallPercentage = totalUrls > 0 ? Math.round((totalValid / totalUrls) * 100) : 0
      
      return NextResponse.json({
        success: true,
        summary: {
          totalCompanies: results.length,
          totalUrls,
          totalValid,
          overallPercentage
        },
        results,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error testing earnings URLs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test URLs' 
      },
      { status: 500 }
    )
  }
}