import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { parseCSVData, calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { downloadTradeDataFromBlob } from './blob-utils'

// This function can only be used server-side
export async function generatePortfolioData(): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    // Check if blob URL is configured
    if (!process.env.TRADE_DATA_BLOB_URL) {
      logger.error('TRADE_DATA_BLOB_URL environment variable is not configured')
      return { holdings: [], exitedPositions: [] }
    }

    // Download CSV from Vercel Blob storage using SDK
    const csvContent = await downloadTradeDataFromBlob()
    
    // Parse trades and calculate holdings
    const trades = parseCSVData(csvContent)
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 