import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { parseCSVData } from '@/lib/portfolio'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'

// Fetch unique company names from portfolio data
async function getPortfolioCompanies(): Promise<string[]> {
  try {
    const companies = new Map<string, string>() // Map of company name to symbol
    
    // Get portfolio data directly
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Add current holdings
    holdings.forEach(holding => {
      if (holding.name && holding.symbol) {
        companies.set(holding.name, holding.symbol)
      }
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      if (position.name && position.symbol) {
        companies.set(position.name, position.symbol)
      }
    })
    
    // Also get raw trade data to ensure we capture all historical companies
    try {
      const csvContent = await downloadTradeDataFromBlob()
      const trades = parseCSVData(csvContent)
      trades.forEach(trade => {
        if (trade.name && trade.code) {
          companies.set(trade.name, trade.code)
        }
      })
    } catch (error) {
      logger.warn('Could not fetch raw trade data for complete company list:', error)
    }
    
    // Convert to array with symbols in parentheses
    const companyList = Array.from(companies.entries()).map(([name, symbol]) => `${name} (${symbol})`)
    logger.info('Found portfolio companies:', companyList)
    
    return companyList.length > 0 ? companyList : [
      // Fallback list if no companies found
      "Microsoft (MSFT)",
      "Tesla (TSLA)", 
      "Fonterra Co-operative Group (FCG)",
      "Fletcher Building (FBU)",
      "Meta Platforms (META)",
      "Salesforce (CRM)",
      "Alphabet (GOOGL)",
      "Amazon (AMZN)",
      "Mainfreight (MFT)"
    ]
  } catch (error) {
    logger.error('Error fetching portfolio companies:', error)
    // Return a fallback list if data fetch fails
    return [
      "Microsoft (MSFT)",
      "Tesla (TSLA)", 
      "Fonterra Co-operative Group (FCG)",
      "Fletcher Building (FBU)",
      "Meta Platforms (META)",
      "Salesforce (CRM)",
      "Alphabet (GOOGL)",
      "Amazon (AMZN)",
      "Mainfreight (MFT)"
    ]
  }
}

export async function GET() {
  try {
    const companies = await getPortfolioCompanies()
    
    // Get date range for the analysis
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return NextResponse.json({
      companies,
      analysis_period: {
        start_date: startDateStr,
        end_date: endDateStr
      },
      report_generated_date: currentDate
    })
  } catch (error: any) {
    logger.error('Error getting companies:', error)
    return NextResponse.json(
      { error: 'Failed to get portfolio companies' },
      { status: 500 }
    )
  }
}