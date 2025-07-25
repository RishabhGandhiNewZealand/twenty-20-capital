import { NextResponse } from 'next/server'
import { parseCSVData } from '@/lib/portfolio'
import { calculatePortfolioPerformance } from '@/lib/portfolioPerformance'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the CSV file from the root directory
    const csvPath = path.join(process.cwd(), 'RishTrades22July25.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse trades and calculate performance data
    const trades = parseCSVData(csvContent)
    const performanceData = await calculatePortfolioPerformance(trades)
    
    return NextResponse.json({
      data: performanceData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating portfolio performance data:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio performance data' },
      { status: 500 }
    )
  }
}