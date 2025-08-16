import { PortfolioHolding, ExitedPosition, TradeRecord } from '@/types/portfolio'
import { calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { getCachedTradeData } from './trade-data-cache'

// This function can only be used server-side
export async function generatePortfolioData(trades?: TradeRecord[]): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    // Use provided trades or fetch cached trade data from database
    const tradeData = trades || await getCachedTradeData()
    
    // If no trades found, return empty arrays
    if (!tradeData || tradeData.length === 0) {
      logger.warn('No trade data found')
      return { holdings: [], exitedPositions: [] }
    }
    
    // Calculate holdings and exited positions
    const { holdings, exitedPositions } = calculatePortfolioData(tradeData)
    
    logger.info(`Generated portfolio data: ${holdings.length} holdings, ${exitedPositions.length} exited positions`)
    
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 