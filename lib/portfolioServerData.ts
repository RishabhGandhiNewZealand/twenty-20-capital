import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { parseCSVData, calculatePortfolioData } from './portfolio'
import fs from 'fs'
import path from 'path'

// This function can only be used server-side
export function generatePortfolioData(): { holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] } {
  try {
    // Read the CSV file from the root directory
    const csvPath = path.join(process.cwd(), 'RishTrades22July25.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse trades and calculate holdings
    const trades = parseCSVData(csvContent)
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    return { holdings, exitedPositions }
  } catch (error) {
    console.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 