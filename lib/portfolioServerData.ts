import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { getTradeData } from './trade-data-cache'

// This function can only be used server-side
export async function generatePortfolioData(forceRefresh: boolean = false): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    // Fetch trade data from database (with optional cache bypass)
    const trades = await getTradeData(forceRefresh)
    
    // If no trades found, return empty arrays
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return { holdings: [], exitedPositions: [] }
    }
    
    // Calculate holdings and exited positions
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    logger.info(`Generated portfolio data: ${holdings.length} holdings, ${exitedPositions.length} exited positions`)
    
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 