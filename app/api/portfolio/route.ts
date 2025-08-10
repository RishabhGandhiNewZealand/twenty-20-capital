import { NextRequest, NextResponse } from 'next/server'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Check if we should bypass cache
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    const { holdings, exitedPositions } = await generatePortfolioData(forceRefresh)
    
    return NextResponse.json({
      holdings,
      exitedPositions,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio data' },
      { status: 500 }
    )
  }
} 