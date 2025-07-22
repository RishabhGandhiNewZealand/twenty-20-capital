import { NextResponse } from 'next/server'
import { generatePortfolioData } from '@/lib/portfolioServerData'

export async function GET() {
  try {
    const { holdings, exitedPositions } = generatePortfolioData()
    
    return NextResponse.json({
      holdings,
      exitedPositions,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio data' },
      { status: 500 }
    )
  }
} 