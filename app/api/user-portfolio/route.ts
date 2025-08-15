import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserDb } from '@/lib/rls-auth'
import { FALLBACK_USD_TO_NZD_RATE, FALLBACK_NZD_TO_USD_RATE, MIN_SHARE_THRESHOLD } from '@/lib/constants'
import yahooFinance from 'yahoo-finance2'

interface CurrentHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  currentValueNZD: number
  costBasisNZD: number
  gainNZD: number
  gainPercent: number
  allocation: number
  currency: string
}

interface ExitedPosition {
  symbol: string
  name: string
  exitDate: string
  totalInvestedNZD: number
  totalProceedsNZD: number
  totalGainNZD: number
  totalReturnPercent: number
}

/**
 * Fetches the current market price for a given stock ticker
 */
async function getCurrentPrice(ticker: string): Promise<number> {
  try {
    let yfinanceTicker = ticker
    if (ticker === 'MFT') {
      yfinanceTicker = 'MFT.NZ'
    }

    const quote = await yahooFinance.quote(yfinanceTicker)
    return quote.regularMarketPrice || 0
  } catch (error) {
    logger.error(`Error fetching current price for ${ticker}:`, error)
    return 0
  }
}

// Get current USD/NZD exchange rate
async function getCurrentUSDNZDRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('NZDUSD=X')
    return 1 / (quote.regularMarketPrice || FALLBACK_NZD_TO_USD_RATE)
  } catch (error) {
    logger.error('Error fetching USD/NZD rate:', error)
    return FALLBACK_USD_TO_NZD_RATE
  }
}

// Get historical price for a specific date
async function getHistoricalPrice(ticker: string, date: Date): Promise<number> {
  try {
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    
    const quotes = await yahooFinance.historical(ticker, {
      period1: date,
      period2: endDate,
      interval: '1d'
    })

    return quotes.length > 0 ? quotes[0].close : 0
  } catch (error) {
    logger.error(`Error fetching historical price for ${ticker} on ${date}:`, error)
    return 0
  }
}

/**
 * GET /api/user-portfolio
 * 
 * Returns portfolio data for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user authentication from headers
    const userIdHeader = request.headers.get('x-user-id')
    const userEmailHeader = request.headers.get('x-user-email')
    const isAdminHeader = request.headers.get('x-is-admin') === 'true'
    
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    logger.info('Fetching user portfolio data', { 
      userId: userIdHeader, 
      email: userEmailHeader,
      isAdmin: isAdminHeader 
    })
    
    const startTime = Date.now()
    
    // Get user-specific database connection
    const sql = getUserDb(userIdHeader)
    
    // Fetch user's trades
    const trades = await sql`
      SELECT 
        id,
        date,
        action as type,
        symbol as code,
        company as name,
        quantity as qty,
        price,
        fees,
        currency as instrumentCurrency,
        notes,
        user_id,
        CASE 
          WHEN currency = 'USD' THEN ${FALLBACK_NZD_TO_USD_RATE}
          ELSE 1
        END as exchRate
      FROM application.trade_data
      WHERE user_id = ${userIdHeader}
        AND deleted = false
      ORDER BY date ASC, id ASC
    `
    
    logger.info(`Fetched ${trades.length} trades for user ${userIdHeader}`)
    
    // Get current exchange rate
    const currentExchangeRate = await getCurrentUSDNZDRate()
    
    // If no trades, return empty portfolio
    if (trades.length === 0) {
      return NextResponse.json({
        holdings: [],
        exitedPositions: [],
        summary: {
          totalValueNZD: 0,
          totalCostBasisNZD: 0,
          totalGainNZD: 0,
          totalGainPercent: 0,
          sp500Value: 0,
          sp500GainNZD: 0,
          sp500GainPercent: 0,
          exchangeRate: currentExchangeRate
        },
        lastUpdated: new Date().toISOString(),
        userId: userIdHeader,
        tradeCount: 0,
        fetchTime: Date.now() - startTime
      })
    }

    // Get current holdings by symbol
    const holdingsBySymbol = new Map<string, {
      shares: number
      totalCostNZD: number
      name: string
      currency: string
    }>()

    // Track exited positions
    const exitedPositions: ExitedPosition[] = []
    const exitedPositionsBySymbol = new Map<string, {
      totalInvestedNZD: number
      totalProceedsNZD: number
      lastExitDate: string
      name: string
    }>()

    // Track S&P 500 shares purchased over time
    let sp500Shares = 0
    let currentCostBasis = 0
    let soldCapitalAvailable = 0

    // Get all unique trade dates for SPY price fetching
    const tradeDates = [...new Set(trades.filter((t: any) => t.type === 'Buy').map((t: any) => t.date))]
    
    // Fetch historical SPY prices for all trade dates
    const spyHistoricalPrices = await Promise.all(
      tradeDates.map(async (dateStr: any) => {
        const date = new Date(dateStr)
        const price = await getHistoricalPrice('SPY', date)
        return { date: dateStr, price }
      })
    )

    // Create a map for quick lookup
    const spyPriceMap = new Map(spyHistoricalPrices.map((p: any) => [p.date, p.price]))

    // Process trades to calculate current holdings and S&P 500 equivalent
    for (const trade of trades) {
      const current = holdingsBySymbol.get(trade.code) || {
        shares: 0,
        totalCostNZD: 0,
        name: trade.name,
        currency: trade.instrumentCurrency
      }

      const exchangeRate = trade.instrumentCurrency === 'USD' ? (1 / trade.exchRate) : 1
      const tradeValueNZD = Math.abs(trade.qty * trade.price * exchangeRate)

      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        current.shares += trade.qty
        if (trade.type === 'Buy') {
          // Only count buys in cost basis, not reinvestments
          current.totalCostNZD += tradeValueNZD

          // Calculate S&P 500 shares that could have been bought
          if (soldCapitalAvailable >= tradeValueNZD) {
            soldCapitalAvailable -= tradeValueNZD
          } else {
            const newCapital = tradeValueNZD - soldCapitalAvailable
            currentCostBasis += newCapital
            soldCapitalAvailable = 0

            // Calculate SPY shares with this new capital
            const spyPrice = spyPriceMap.get(trade.date) || 0
            if (spyPrice > 0) {
              // Get historical exchange rate for this date
              const spyPriceNZD = spyPrice * exchangeRate
              sp500Shares += newCapital / spyPriceNZD
            }
          }
        }
      } else if (trade.type === 'Sell') {
        // For sells, qty should be positive in the database but we treat it as negative
        const sharesSold = Math.abs(trade.qty)
        const sharesBeforeSale = current.shares
        current.shares -= sharesSold
        
        // Track exited position if all shares sold
        if (current.shares <= MIN_SHARE_THRESHOLD) {
          const exitedData = exitedPositionsBySymbol.get(trade.code) || {
            totalInvestedNZD: 0,
            totalProceedsNZD: 0,
            lastExitDate: trade.date,
            name: trade.name
          }
          
          exitedData.totalInvestedNZD += current.totalCostNZD
          exitedData.totalProceedsNZD += tradeValueNZD
          exitedData.lastExitDate = trade.date
          
          exitedPositionsBySymbol.set(trade.code, exitedData)
          
          // Reset cost basis
          current.totalCostNZD = 0
        } else {
          // Proportionally reduce cost basis if shares remain
          if (sharesBeforeSale > 0) {
            const remainingRatio = current.shares / sharesBeforeSale
            current.totalCostNZD *= remainingRatio
          }
        }
        
        soldCapitalAvailable += tradeValueNZD
      }

      if (current.shares > MIN_SHARE_THRESHOLD) { // Only keep positions with shares
        holdingsBySymbol.set(trade.code, current)
      } else {
        holdingsBySymbol.delete(trade.code)
      }
    }

    // Convert exited positions map to array
    exitedPositionsBySymbol.forEach((position, symbol) => {
      const totalGainNZD = position.totalProceedsNZD - position.totalInvestedNZD
      const totalReturnPercent = position.totalInvestedNZD > 0 
        ? (totalGainNZD / position.totalInvestedNZD) * 100 
        : 0

      exitedPositions.push({
        symbol,
        name: position.name,
        exitDate: position.lastExitDate,
        totalInvestedNZD: position.totalInvestedNZD,
        totalProceedsNZD: position.totalProceedsNZD,
        totalGainNZD,
        totalReturnPercent
      })
    })

    // Sort exited positions by exit date descending
    exitedPositions.sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())

    // Get current prices
    const tickers = Array.from(holdingsBySymbol.keys())
    
    // Fetch all current prices in parallel, including SPY
    const prices = await Promise.all([
      ...tickers.map(ticker => getCurrentPrice(ticker)),
      getCurrentPrice('SPY')
    ])

    // Create price map
    const priceMap = new Map<string, number>()
    tickers.forEach((ticker, index) => {
      priceMap.set(ticker, prices[index])
    })
    const currentSpyPrice = prices[prices.length - 1]

    // Calculate current values
    const holdings: CurrentHolding[] = []
    let totalValueNZD = 0

    holdingsBySymbol.forEach((holding, symbol) => {
      const currentPrice = priceMap.get(symbol) || 0
      const currentValueNZD = holding.shares * currentPrice * (holding.currency === 'USD' ? currentExchangeRate : 1)
      
      holdings.push({
        symbol,
        name: holding.name,
        shares: holding.shares,
        currentPrice,
        currentValueNZD,
        costBasisNZD: holding.totalCostNZD,
        gainNZD: currentValueNZD - holding.totalCostNZD,
        gainPercent: holding.totalCostNZD > 0 ? ((currentValueNZD - holding.totalCostNZD) / holding.totalCostNZD * 100) : 0,
        allocation: 0, // Will calculate after total
        currency: holding.currency
      })

      totalValueNZD += currentValueNZD
    })

    // Calculate allocations
    holdings.forEach(holding => {
      holding.allocation = totalValueNZD > 0 ? (holding.currentValueNZD / totalValueNZD) * 100 : 0
    })

    // Sort by allocation descending
    holdings.sort((a, b) => b.allocation - a.allocation)

    // Calculate total gain
    const totalGainNZD = totalValueNZD - currentCostBasis
    const totalGainPercent = currentCostBasis > 0 ? (totalGainNZD / currentCostBasis * 100) : 0

    // Calculate S&P 500 equivalent value
    const sp500ValueUSD = sp500Shares * currentSpyPrice
    const sp500Value = sp500ValueUSD * currentExchangeRate
    const sp500GainNZD = sp500Value - currentCostBasis
    const sp500GainPercent = currentCostBasis > 0 ? (sp500GainNZD / currentCostBasis * 100) : 0
    
    const duration = Date.now() - startTime
    logger.info(`User portfolio data generated in ${duration}ms`)
    
    return NextResponse.json({
      holdings,
      exitedPositions,
      summary: {
        totalValueNZD,
        totalCostBasisNZD: currentCostBasis,
        totalGainNZD,
        totalGainPercent,
        sp500Value,
        sp500GainNZD,
        sp500GainPercent,
        exchangeRate: currentExchangeRate
      },
      lastUpdated: new Date().toISOString(),
      userId: userIdHeader,
      tradeCount: trades.length,
      fetchTime: duration
    })
  } catch (error) {
    logger.error('Error fetching user portfolio data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}