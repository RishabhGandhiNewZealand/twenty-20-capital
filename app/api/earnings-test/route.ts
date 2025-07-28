import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Test if we can import the enhanced earnings module
    const { getEnhancedEarningsData } = await import('@/lib/earnings-data-enhanced')
    
    // Test with a simple set of symbols
    const testSymbols = ['AAPL', 'MSFT', 'GOOGL']
    const testNames = ['Apple Inc.', 'Microsoft Corporation', 'Alphabet Inc.']
    
    logger.info('Testing earnings data fetch...')
    
    const data = await getEnhancedEarningsData(testSymbols, testNames)
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}