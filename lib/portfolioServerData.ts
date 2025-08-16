import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { getCachedTradeData } from './trade-data-cache'

// This function can only be used server-side
export async function generatePortfolioData(): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    const adminUserId = process.env.ADMIN_USER_ID || ''
    const trades = await getCachedTradeData(adminUserId)
    
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      return { holdings: [], exitedPositions: [] }
    }
    
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    logger.info(`Generated portfolio data: ${holdings.length} holdings, ${exitedPositions.length} exited positions`)
    
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data:', error)
    return { holdings: [], exitedPositions: [] }
  }
}

export async function generatePortfolioDataForUser(userId: string): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    const trades = await getCachedTradeData(userId)
    if (!trades || trades.length === 0) {
      logger.warn(`No trade data found in database for user ${userId}`)
      return { holdings: [], exitedPositions: [] }
    }
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    logger.info(`Generated portfolio data for user ${userId}: ${holdings.length} holdings, ${exitedPositions.length} exited positions`)
    return { holdings, exitedPositions }
  } catch (error) {
    logger.error('Error generating portfolio data for user:', error)
    return { holdings: [], exitedPositions: [] }
  }
} 