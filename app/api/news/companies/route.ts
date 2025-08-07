import { NextResponse } from 'next/server'
import { getCachedTradeData } from '@/lib/trade-data-cache'
import { logger } from '@/lib/logger'
import { MIN_SHARE_THRESHOLD } from '@/lib/constants'

export async function GET() {
  try {
    // Fetch cached trade data from database
    const trades = await getCachedTradeData()
    
    // If no trades found, return fallback response
    if (!trades || trades.length === 0) {
      logger.warn('No trade data found in database')
      // Return fallback list
      const fallbackCompanies = [
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
      
      const currentDate = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      return NextResponse.json({
        companies: fallbackCompanies,
        analysis_period: {
          start_date: startDateStr,
          end_date: endDateStr
        },
        report_generated_date: currentDate,
        totalCompanies: fallbackCompanies.length,
        currentHoldings: 0,
        historicalHoldings: fallbackCompanies.length
      })
    }

    // Track all companies and current holdings
    const allCompanies = new Map<string, string>() // Map of company name to symbol
    const holdingsBySymbol = new Map<string, number>()
    
    // Process all trades to get unique companies and current holdings
    for (const trade of trades) {
      // Track all companies that have been traded
      if (trade.name && trade.code) {
        allCompanies.set(trade.name, trade.code)
      }
      
      // Calculate current holdings
      const currentShares = holdingsBySymbol.get(trade.code) || 0
      
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        holdingsBySymbol.set(trade.code, currentShares + trade.qty)
      } else if (trade.type === 'Sell') {
        holdingsBySymbol.set(trade.code, currentShares + trade.qty) // qty is negative for sells
      }
    }
    
    // Separate current and historical companies
    const currentCompanies = new Set<string>()
    const historicalCompanies = new Set<string>()
    
    // Categorize companies
    allCompanies.forEach((symbol, name) => {
      const shares = holdingsBySymbol.get(symbol) || 0
      const companyWithSymbol = `${name} (${symbol})`
      
      if (shares > MIN_SHARE_THRESHOLD) {
        currentCompanies.add(companyWithSymbol)
      } else {
        historicalCompanies.add(companyWithSymbol)
      }
    })
    
    // Combine all companies (current first, then historical)
    const allCompaniesList = [
      ...Array.from(currentCompanies).sort(),
      ...Array.from(historicalCompanies).sort()
    ]
    
    logger.info(`Found ${currentCompanies.size} current holdings and ${historicalCompanies.size} historical holdings`)
    
    // Get date range for the analysis
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return NextResponse.json({
      companies: allCompaniesList.length > 0 ? allCompaniesList : [
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
      ],
      analysis_period: {
        start_date: startDateStr,
        end_date: endDateStr
      },
      report_generated_date: currentDate,
      totalCompanies: allCompaniesList.length,
      currentHoldings: currentCompanies.size,
      historicalHoldings: historicalCompanies.size,
      // Additional metadata for the UI
      companiesByCategory: {
        current: Array.from(currentCompanies).sort(),
        historical: Array.from(historicalCompanies).sort()
      }
    })
  } catch (error: any) {
    logger.error('Error getting companies:', error)
    return NextResponse.json(
      { error: 'Failed to get portfolio companies' },
      { status: 500 }
    )
  }
}