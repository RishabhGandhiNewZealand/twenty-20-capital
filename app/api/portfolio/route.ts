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
    })
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio data' },
      { status: 500 }
    )
  }
} 