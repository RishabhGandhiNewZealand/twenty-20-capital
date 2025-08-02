import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getMultipleEarningsData, EarningsInfo } from '@/lib/earnings-data'
import fs from 'fs/promises'
import path from 'path'

interface CachedCompany {
  symbol: string
  name: string
  instrumentCurrency: string
  marketCode: string
  isCurrentHolding: boolean
  wasExited: boolean
}

interface EarningsData extends EarningsInfo {
  isInPortfolio: boolean
  wasInPortfolio: boolean
  currency?: string
}

async function getCachedPortfolioCompanies(): Promise<CachedCompany[]> {
  try {
    // Try to read from cached file first
    const filePath = path.join(process.cwd(), 'public', 'data', 'portfolio-companies.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    return data.companies || []
  } catch (error) {
    logger.error('Error reading cached portfolio companies:', error)
    
    // Fallback to generating from portfolio data
    try {
      const { generatePortfolioData } = await import('@/lib/portfolioServerData')
      const { holdings, exitedPositions } = await generatePortfolioData()
      
      const companies: CachedCompany[] = []
      
      // Add current holdings
      holdings.forEach(holding => {
        companies.push({
          symbol: holding.symbol,
          name: holding.name,
          instrumentCurrency: holding.instrumentCurrency,
          marketCode: holding.marketCode,
          isCurrentHolding: true,
          wasExited: false
        })
      })
      
      // Add exited positions
      exitedPositions.forEach(position => {
        const existing = companies.find(c => c.symbol === position.symbol)
        if (!existing) {
          companies.push({
            symbol: position.symbol,
            name: position.name,
            instrumentCurrency: position.instrumentCurrency,
            marketCode: position.marketCode,
            isCurrentHolding: false,
            wasExited: true
          })
        }
      })
      
      return companies
    } catch (fallbackError) {
      logger.error('Error in fallback portfolio generation:', fallbackError)
      return []
    }
  }
}

export async function GET() {
  try {
    // Get cached portfolio companies
    const portfolioCompanies = await getCachedPortfolioCompanies()
    
    if (portfolioCompanies.length === 0) {
      return NextResponse.json({
        earnings: [],
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        lastUpdated: new Date().toISOString(),
        message: 'No portfolio companies found'
      })
    }
    
    // Get all unique symbols
    const allSymbols = portfolioCompanies.map(c => c.symbol)
    
    logger.info(`Fetching earnings data for ${allSymbols.length} companies: ${allSymbols.join(', ')}`)
    
    // Fetch real earnings data from Yahoo Finance
    const earningsMap = await getMultipleEarningsData(allSymbols)
    
    logger.info(`Received earnings data for ${earningsMap.size} companies`)
    
    // Get current date
    const today = new Date()
    const daysBefore = 45
    const daysAfter = 45
    
    // Calculate date range
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysBefore)
    
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysAfter)
    
    // Filter earnings data for portfolio companies within date range
    const earningsData: EarningsData[] = []
    
    for (const company of portfolioCompanies) {
      const earnings = earningsMap.get(company.symbol)
      if (!earnings) {
        logger.warn(`No earnings data found for ${company.symbol}`)
        continue
      }
      
      const nextEarningsDate = earnings.nextEarningsDate ? new Date(earnings.nextEarningsDate) : null
      const previousEarningsDate = earnings.previousEarningsDate ? new Date(earnings.previousEarningsDate) : null
      
      // Check if earnings fall within our date range
      const hasUpcomingEarnings = nextEarningsDate && nextEarningsDate >= today && nextEarningsDate <= endDate
      const hasRecentEarnings = previousEarningsDate && previousEarningsDate >= startDate && previousEarningsDate < today
      
      // Include companies with any earnings data in the range
      if (hasUpcomingEarnings || hasRecentEarnings || earnings.nextEarningsDate || earnings.previousEarningsDate) {
        earningsData.push({
          ...earnings,
          isInPortfolio: company.isCurrentHolding,
          wasInPortfolio: company.wasExited,
          currency: company.instrumentCurrency,
        })
      }
    }
    
    logger.info(`Found ${earningsData.length} companies with earnings data in range`)
    
    // Sort by next earnings date (upcoming first) then by previous earnings date
    earningsData.sort((a, b) => {
      // First, prioritize items with upcoming earnings
      if (a.nextEarningsDate && !b.nextEarningsDate) return -1
      if (!a.nextEarningsDate && b.nextEarningsDate) return 1
      
      // If both have upcoming earnings, sort by date
      if (a.nextEarningsDate && b.nextEarningsDate) {
        return new Date(a.nextEarningsDate).getTime() - new Date(b.nextEarningsDate).getTime()
      }
      
      // If both have only previous earnings, sort by date (most recent first)
      if (a.previousEarningsDate && b.previousEarningsDate) {
        return new Date(b.previousEarningsDate).getTime() - new Date(a.previousEarningsDate).getTime()
      }
      
      return 0
    })
    
    return NextResponse.json({
      earnings: earningsData,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalCompanies: portfolioCompanies.length,
      companiesWithData: earningsData.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error fetching earnings data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch earnings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}