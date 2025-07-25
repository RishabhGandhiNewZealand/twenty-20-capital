import { parseCSVData } from './portfolio'
import { TradeRecord } from '@/types/portfolio'
import { getHistoricalPrices, getUSDNZDExchangeRate } from './yahooFinanceApi'
import fs from 'fs'
import path from 'path'

interface DailyHoldings {
  [ticker: string]: number
}

interface DailyValues {
  [ticker: string]: number
  Total_Portfolio_NZD: number
}

interface DailyCostBasis {
  Cost_Basis_NZD: number
}

interface PriceData {
  [date: string]: number
}

interface ExchangeRateData {
  [date: string]: number
}

export class PortfolioHistoryCalculator {
  private tradesData: TradeRecord[] = []
  private dailyHoldings: { [date: string]: DailyHoldings } = {}
  private dailyValuesNZD: { [date: string]: DailyValues } = {}
  private dailyCostBasis: { [date: string]: DailyCostBasis } = {}
  private stockPrices: { [ticker: string]: PriceData } = {}
  private usdNzdRate: ExchangeRateData = {}
  private portfolioStartDate: Date = new Date()
  private portfolioEndDate: Date = new Date()

  constructor() {
    this.loadAndProcessTrades()
  }

  private loadAndProcessTrades() {
    try {
      const csvPath = path.join(process.cwd(), 'RishTrades22July25.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      this.tradesData = parseCSVData(csvContent)

      if (this.tradesData.length === 0) {
        throw new Error('No trades data found')
      }

      // Sort trades by date
      this.tradesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Set portfolio date range
      this.portfolioStartDate = new Date(this.tradesData[0].date)
      this.portfolioEndDate = new Date()

      console.log(`Portfolio period: ${this.portfolioStartDate.toDateString()} to ${this.portfolioEndDate.toDateString()}`)
      console.log(`Total transactions: ${this.tradesData.length}`)
      console.log(`Unique tickers: ${[...new Set(this.tradesData.map(t => t.code))].sort().join(', ')}`)
    } catch (error) {
      console.error('Error loading trades data:', error)
      throw error
    }
  }

  async calculateDailyHoldings(): Promise<void> {
    if (this.tradesData.length === 0) {
      throw new Error('No trades data available')
    }

    // Create complete date range from first trade to today
    const dateRange = this.getDateRange(this.portfolioStartDate, this.portfolioEndDate)
    const tickers = [...new Set(this.tradesData.map(t => t.code))].sort()

    console.log(`Calculating daily holdings for ${tickers.length} tickers over ${dateRange.length} days...`)

    // Initialize holdings for all dates
    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      this.dailyHoldings[dateStr] = {}
      for (const ticker of tickers) {
        this.dailyHoldings[dateStr][ticker] = 0
      }
    }

    // Process each ticker separately
    for (const ticker of tickers) {
      console.log(`Processing ${ticker}...`)
      const tickerTrades = this.tradesData.filter(t => t.code === ticker)
      tickerTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let currentHoldings = 0

      for (const date of dateRange) {
        const dateStr = this.formatDate(date)
        
        // Check if there are any trades on this date for this ticker
        const tradesOnDate = tickerTrades.filter(t => t.date === dateStr)
        
        for (const trade of tradesOnDate) {
          if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
            currentHoldings += trade.qty
          } else if (trade.type === 'Sell') {
            currentHoldings += trade.qty // trade.qty is already negative for sells
          }
        }

        this.dailyHoldings[dateStr][ticker] = currentHoldings
      }
    }

    // Forward fill any gaps
    for (const ticker of tickers) {
      let lastKnownValue = 0
      for (const date of dateRange) {
        const dateStr = this.formatDate(date)
        if (this.dailyHoldings[dateStr][ticker] !== 0) {
          lastKnownValue = this.dailyHoldings[dateStr][ticker]
        } else {
          this.dailyHoldings[dateStr][ticker] = lastKnownValue
        }
      }
    }

    console.log('Daily holdings calculation complete!')
  }

  async fetchHistoricalPricesForAllStocks(): Promise<void> {
    if (this.tradesData.length === 0) {
      throw new Error('No trades data available')
    }

    const tickers = [...new Set(this.tradesData.map(t => t.code))].sort()
    const startDateStr = this.formatDate(this.portfolioStartDate)
    const endDateStr = this.formatDate(this.portfolioEndDate)

    console.log(`Fetching historical prices for ${tickers.length} stocks...`)

    // Fetch USD/NZD exchange rate
    console.log('Fetching USD/NZD exchange rate...')
    try {
      const fxData = await getUSDNZDExchangeRate(startDateStr, endDateStr)
      this.usdNzdRate = this.fillMissingDates(fxData, this.portfolioStartDate, this.portfolioEndDate)
      console.log('   Success: USD/NZD rate data fetched')
    } catch (error) {
      console.log('   Warning: Could not fetch USD/NZD rate - will use fallback rate of 1.65')
      // Create fallback exchange rate data
      const dateRange = this.getDateRange(this.portfolioStartDate, this.portfolioEndDate)
      for (const date of dateRange) {
        this.usdNzdRate[this.formatDate(date)] = 1.65
      }
    }

    // Fetch price data for each stock
    for (const ticker of tickers) {
      console.log(`Fetching prices for ${ticker}...`)
      try {
        const priceData = await getHistoricalPrices(ticker, startDateStr, endDateStr)
        if (priceData && Object.keys(priceData).length > 0) {
          this.stockPrices[ticker] = this.fillMissingDates(priceData, this.portfolioStartDate, this.portfolioEndDate)
          console.log(`   Success: ${Object.keys(priceData).length} days of price data`)
        } else {
          throw new Error('No price data returned')
        }
      } catch (error) {
        console.log(`   Failed to fetch data for ${ticker}: ${error}`)
        // Create fallback price data with last known price
        const dateRange = this.getDateRange(this.portfolioStartDate, this.portfolioEndDate)
        this.stockPrices[ticker] = {}
        for (const date of dateRange) {
          this.stockPrices[ticker][this.formatDate(date)] = 0 // Will be handled in value calculation
        }
      }
    }
  }

  async calculateDailyPortfolioValuesNZD(): Promise<{ index: string[], data: DailyValues[] } | null> {
    if (Object.keys(this.dailyHoldings).length === 0) {
      throw new Error('Calculate daily holdings first')
    }

    if (Object.keys(this.stockPrices).length === 0) {
      console.log('Fetching historical prices...')
      await this.fetchHistoricalPricesForAllStocks()
    }

    console.log('Calculating daily portfolio values in NZD...')

    const dateRange = this.getDateRange(this.portfolioStartDate, this.portfolioEndDate)
    const tickers = Object.keys(this.dailyHoldings[this.formatDate(dateRange[0])] || {})

    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      this.dailyValuesNZD[dateStr] = { Total_Portfolio_NZD: 0 }

      for (const ticker of tickers) {
        console.log(`Processing values for ${ticker} on ${dateStr}...`)

        const shares = this.dailyHoldings[dateStr]?.[ticker] || 0
        if (shares === 0) {
          this.dailyValuesNZD[dateStr][ticker] = 0
          continue
        }

        // Get currency for this ticker
        const tickerTrades = this.tradesData.filter(t => t.code === ticker)
        const currency = tickerTrades.length > 0 ? tickerTrades[0].instrumentCurrency : 'USD'

        // Get price for this date
        let priceUsdOrNzd = this.stockPrices[ticker]?.[dateStr]
        
        if (!priceUsdOrNzd || priceUsdOrNzd === 0) {
          // Find the closest previous date with price data
          const availableDates = Object.keys(this.stockPrices[ticker] || {})
            .filter(d => new Date(d) <= new Date(dateStr) && this.stockPrices[ticker][d] > 0)
            .sort()
          
          if (availableDates.length > 0) {
            const closestDate = availableDates[availableDates.length - 1]
            priceUsdOrNzd = this.stockPrices[ticker][closestDate]
          }
        }

        if (priceUsdOrNzd && priceUsdOrNzd > 0) {
          let valueNZD = 0

          if (currency === 'USD') {
            // Convert USD to NZD using exchange rate
            const fxRate = this.usdNzdRate[dateStr] || 1.65 // Fallback rate
            valueNZD = shares * priceUsdOrNzd * fxRate
          } else {
            // NZD stock (like MFT)
            valueNZD = shares * priceUsdOrNzd
          }

          this.dailyValuesNZD[dateStr][ticker] = valueNZD
        } else {
          // No price data available, use previous day's value or zero
          const prevDate = this.getPreviousDate(date)
          const prevDateStr = this.formatDate(prevDate)
          
          if (this.dailyValuesNZD[prevDateStr]?.[ticker]) {
            this.dailyValuesNZD[dateStr][ticker] = this.dailyValuesNZD[prevDateStr][ticker]
          } else {
            this.dailyValuesNZD[dateStr][ticker] = 0
          }
        }
      }

      // Calculate total portfolio value
      let totalValue = 0
      for (const ticker of tickers) {
        totalValue += this.dailyValuesNZD[dateStr][ticker] || 0
      }
      this.dailyValuesNZD[dateStr].Total_Portfolio_NZD = totalValue
    }

    console.log('Daily portfolio values calculation complete!')

    // Convert to the expected format
    const index = dateRange.map(d => this.formatDate(d))
    const data = index.map(dateStr => this.dailyValuesNZD[dateStr])

    return { index, data }
  }

  async calculateDailyCostBasis(): Promise<{ index: string[], data: DailyCostBasis[] } | null> {
    if (this.tradesData.length === 0) {
      throw new Error('No trades data available to calculate cost basis')
    }

    console.log('Calculating daily cost basis...')

    const dateRange = this.getDateRange(this.portfolioStartDate, this.portfolioEndDate)
    let currentPortfolioCostBasis = 0
    let soldCapitalAvailableForReinvestment = 0

    // Initialize all dates with 0
    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      this.dailyCostBasis[dateStr] = { Cost_Basis_NZD: 0 }
    }

    // Group trades by date to process chronologically
    const tradesByDate = new Map<string, TradeRecord[]>()
    for (const trade of this.tradesData) {
      if (!tradesByDate.has(trade.date)) {
        tradesByDate.set(trade.date, [])
      }
      tradesByDate.get(trade.date)!.push(trade)
    }

    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      const dailyTrades = tradesByDate.get(dateStr) || []

      for (const trade of dailyTrades) {
        const qty = trade.qty
        const price = trade.price
        const tradeType = trade.type
        const instrumentCurrency = trade.instrumentCurrency

        // Determine FX rate for the trade date
        let fxRate = 1.0 // Default for NZD
        if (instrumentCurrency === 'USD') {
          fxRate = this.usdNzdRate[dateStr] || 1.65 // Fallback rate
        }

        const tradeValueNZD = qty * price * fxRate
        let newCapitalInjected = 0

        if (tradeType === 'Buy') {
          if (soldCapitalAvailableForReinvestment >= tradeValueNZD) {
            // Buy is fully covered by reinvested proceeds, no new capital
            soldCapitalAvailableForReinvestment -= tradeValueNZD
          } else {
            // Buy is partially or fully new capital
            newCapitalInjected = tradeValueNZD - soldCapitalAvailableForReinvestment
            currentPortfolioCostBasis += newCapitalInjected
            soldCapitalAvailableForReinvestment = 0 // Reset once exhausted
          }
        } else if (tradeType === 'Sell') {
          // Sell transactions do not decrease cost basis, but add to reinvestable capital
          // Note: trade.qty for sells is already negative, so we need to handle this correctly
          soldCapitalAvailableForReinvestment -= tradeValueNZD // This adds to available capital since tradeValueNZD is negative
        } else if (tradeType === 'Reinvestment') {
          // Reinvestment does not increase cost basis
          // Do nothing to currentPortfolioCostBasis
        }

        console.log(`${tradeType}: ${currentPortfolioCostBasis}, ${tradeValueNZD}, ${newCapitalInjected}, ${soldCapitalAvailableForReinvestment}`)
      }

      // Store the current portfolio cost basis for this date
      this.dailyCostBasis[dateStr].Cost_Basis_NZD = currentPortfolioCostBasis
    }

    // Forward fill missing dates
    let lastKnownCostBasis = 0
    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      if (this.dailyCostBasis[dateStr].Cost_Basis_NZD > 0) {
        lastKnownCostBasis = this.dailyCostBasis[dateStr].Cost_Basis_NZD
      } else if (lastKnownCostBasis > 0) {
        this.dailyCostBasis[dateStr].Cost_Basis_NZD = lastKnownCostBasis
      }
    }

    console.log('Daily cost basis calculation complete!')

    // Convert to the expected format
    const index = dateRange.map(d => this.formatDate(d))
    const data = index.map(dateStr => this.dailyCostBasis[dateStr])

    return { index, data }
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private getPreviousDate(date: Date): Date {
    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    return prevDate
  }

  private fillMissingDates(data: PriceData | ExchangeRateData, startDate: Date, endDate: Date): PriceData | ExchangeRateData {
    const dateRange = this.getDateRange(startDate, endDate)
    const filledData: PriceData | ExchangeRateData = {}
    
    let lastKnownValue = 0
    
    for (const date of dateRange) {
      const dateStr = this.formatDate(date)
      
      if (data[dateStr] && data[dateStr] > 0) {
        lastKnownValue = data[dateStr]
        filledData[dateStr] = data[dateStr]
      } else {
        filledData[dateStr] = lastKnownValue
      }
    }
    
    return filledData
  }
}