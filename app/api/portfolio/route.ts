import { NextResponse } from 'next/server'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    return NextResponse.json({
      holdings,
      exitedPositions,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio data' },
      { status: 500 }
    )
  }
} 