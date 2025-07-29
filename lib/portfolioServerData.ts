import { PortfolioHolding, ExitedPosition } from '@/types/portfolio'
import { parseCSVData, calculatePortfolioData } from './portfolio'
import { logger } from './logger'
import { downloadTradeDataFromBlob } from './blob-utils'

// Mock data for development
const mockHoldings: PortfolioHolding[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    totalShares: 100,
    avgPriceNZD: 250,
    avgPriceUSD: 150,
    allocation: 25,
    instrumentCurrency: 'USD',
    marketCode: 'NASDAQ',
    firstPurchaseDate: '2023-01-15'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    totalShares: 50,
    avgPriceNZD: 500,
    avgPriceUSD: 300,
    allocation: 20,
    instrumentCurrency: 'USD',
    marketCode: 'NASDAQ',
    firstPurchaseDate: '2023-02-20'
  },
  {
    symbol: 'MFT.NZ',
    name: 'Mainfreight Limited',
    totalShares: 200,
    avgPriceNZD: 75,
    allocation: 15,
    instrumentCurrency: 'NZD',
    marketCode: 'NZX',
    firstPurchaseDate: '2023-03-10'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    totalShares: 30,
    avgPriceNZD: 180,
    avgPriceUSD: 110,
    allocation: 18,
    instrumentCurrency: 'USD',
    marketCode: 'NASDAQ',
    firstPurchaseDate: '2023-04-05'
  }
]

const mockExitedPositions: ExitedPosition[] = [
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    instrumentCurrency: 'USD',
    marketCode: 'NASDAQ',
    entryDate: '2022-06-15',
    exitDate: '2023-12-20',
    totalInvestedNZD: 15000,
    totalReturnNZD: 18000,
    profitLossNZD: 3000,
    profitLossPercentage: 20
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    instrumentCurrency: 'USD',
    marketCode: 'NASDAQ',
    entryDate: '2022-08-10',
    exitDate: '2024-01-15',
    totalInvestedNZD: 10000,
    totalReturnNZD: 12500,
    profitLossNZD: 2500,
    profitLossPercentage: 25
  }
]

// This function can only be used server-side
export async function generatePortfolioData(): Promise<{ holdings: PortfolioHolding[], exitedPositions: ExitedPosition[] }> {
  try {
    // Check if blob URL is configured
    if (!process.env.TRADE_DATA_BLOB_URL) {
      logger.warn('TRADE_DATA_BLOB_URL not configured, using mock data for development')
      return { holdings: mockHoldings, exitedPositions: mockExitedPositions }
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