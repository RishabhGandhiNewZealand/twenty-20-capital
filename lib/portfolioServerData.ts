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
      // Don't expose the URL in error messages
      logger.error('Failed to fetch trade data from blob storage', { status: response.status })
      throw new Error('Failed to fetch trade data')
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