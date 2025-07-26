import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { parseCSVData, calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { TRADE_DATA_BLOB_URL } from './constants'

// This function can only be used server-side
export async function generatePortfolioData(): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    // Read CSV from Vercel Blob storage
    const response = await fetch(TRADE_DATA_BLOB_URL)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV from blob storage: ${response.statusText}`)
    }
    
    const csvContent = await response.text()
    
    // Parse trades and calculate holdings
    const trades = parseCSVData(csvContent)
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 