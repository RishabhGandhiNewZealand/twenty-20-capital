import { NextResponse } from 'next/server'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'
import { parseCSVData } from '@/lib/portfolio'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

interface HistoricalHolding {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }
    
    const targetDate = new Date(dateParam)
    
    // Download and parse trade data
    const csvData = await downloadTradeDataFromBlob()
    const { trades } = parseCSVData(csvData)
    
    // Calculate holdings up to the target date
    const holdingsMap = new Map<string, {
      symbol: string
      name: string
      shares: number
      totalCostNZD: number
      currency: string
    }>()
    
    // Process all trades up to the target date
    trades
      .filter(trade => new Date(trade.date) <= targetDate)
      .forEach(trade => {
        const existing = holdingsMap.get(trade.ticker) || {
          symbol: trade.ticker,
          name: trade.company,
          shares: 0,
          totalCostNZD: 0,
          currency: trade.currency
        }
        
        if (trade.type === 'BUY') {
          existing.shares += trade.shares
          existing.totalCostNZD += trade.totalNZD
        } else if (trade.type === 'SELL') {
          // Calculate weighted average cost basis
          if (existing.shares > 0) {
            const remainingShares = existing.shares - trade.shares
            if (remainingShares > 0) {
              const costPerShare = existing.totalCostNZD / existing.shares
              existing.totalCostNZD = costPerShare * remainingShares
            } else {
              existing.totalCostNZD = 0
            }
            existing.shares = remainingShares
          }
        }
        
        holdingsMap.set(trade.ticker, existing)
      })
    
    // Fetch historical prices for the target date
    const holdings: HistoricalHolding[] = []
    let totalValueNZD = 0
    let exchangeRate = FALLBACK_USD_TO_NZD_RATE
    
    // Get exchange rate for the date
    try {
      const nzdusd = await yahooFinance.historical('NZDUSD=X', {
        period1: new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
        period2: targetDate,
        interval: '1d'
      })
      
      if (nzdusd.length > 0) {
        exchangeRate = 1 / nzdusd[nzdusd.length - 1].close
      }
    } catch (error) {
      logger.warn('Failed to fetch exchange rate, using fallback')
    }
    
    // Get historical prices for each holding
    for (const [symbol, holding] of holdingsMap) {
      if (holding.shares <= 0) continue
      
      try {
        let yfinanceSymbol = symbol
        if (symbol === 'MFT') {
          yfinanceSymbol = 'MFT.NZ'
        }
        
        // Fetch historical price
        const quotes = await yahooFinance.historical(yfinanceSymbol, {
          period1: new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
          period2: targetDate,
          interval: '1d'
        })
        
        if (quotes.length > 0) {
          const price = quotes[quotes.length - 1].close
          const priceNZD = holding.currency === 'USD' ? price * exchangeRate : price
          const valueNZD = priceNZD * holding.shares
          
          holdings.push({
            symbol: holding.symbol,
            name: holding.name,
            shares: holding.shares,
            currentPrice: price,
            currentValueNZD: valueNZD,
            costBasisNZD: holding.totalCostNZD,
            gainNZD: valueNZD - holding.totalCostNZD,
            gainPercent: ((valueNZD - holding.totalCostNZD) / holding.totalCostNZD) * 100,
            allocation: 0, // Will be calculated after
            currency: holding.currency
          })
          
          totalValueNZD += valueNZD
        }
      } catch (error) {
        logger.error(`Failed to fetch price for ${symbol}:`, error)
      }
    }
    
    // Calculate allocations
    holdings.forEach(holding => {
      holding.allocation = (holding.currentValueNZD / totalValueNZD) * 100
    })
    
    // Sort by value descending
    holdings.sort((a, b) => b.currentValueNZD - a.currentValueNZD)
    
    return NextResponse.json({
      holdings,
      date: targetDate.toISOString(),
      totalValueNZD,
      exchangeRate
    })
    
  } catch (error) {
    logger.error('Error calculating historical holdings:', error)
    return NextResponse.json(
      { error: 'Failed to calculate historical holdings' },
      { status: 500 }
    )
  }
}