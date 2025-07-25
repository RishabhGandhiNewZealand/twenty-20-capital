import { NextResponse } from 'next/server'
import { PortfolioHistoryCalculator } from '@/lib/portfolioHistoryCalculator'

export async function GET() {
  try {
    const calculator = new PortfolioHistoryCalculator()
    
    // Calculate daily holdings
    await calculator.calculateDailyHoldings()
    
    // Fetch historical prices for all stocks
    await calculator.fetchHistoricalPricesForAllStocks()
    
    // Calculate daily portfolio values
    const dailyValues = await calculator.calculateDailyPortfolioValuesNZD()
    
    // Calculate daily cost basis
    const dailyCostBasis = await calculator.calculateDailyCostBasis()
    
    if (!dailyValues || !dailyCostBasis) {
      throw new Error('Failed to calculate portfolio history')
    }
    
    // Prepare data for the chart
    const chartData = []
    const dates = dailyValues.index || []
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      const dailyValueData = dailyValues.data ? dailyValues.data[i] : null
      const dailyCostData = dailyCostBasis.data ? dailyCostBasis.data[i] : null
      
      const totalValue = dailyValueData?.Total_Portfolio_NZD || 0
      const costBasis = dailyCostData?.Cost_Basis_NZD || 0
      
      if (totalValue > 0 || costBasis > 0) {
        chartData.push({
          date: date,
          portfolioValue: totalValue,
          costBasis: costBasis
        })
      }
    }
    
    return NextResponse.json({
      chartData,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error calculating portfolio history:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio history' },
      { status: 500 }
    )
  }
}