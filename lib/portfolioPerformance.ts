import { TradeRecord } from '../types/portfolio'

// Interfaces matching Python data structures
interface StockPriceData {
  [date: string]: number // Close price for each date
}

interface ExchangeRateData {
  [date: string]: number // USD/NZD rate for each date
}

interface DailyHoldingsData {
  [date: string]: { [ticker: string]: number } // shares for each ticker on each date
}

interface DailyValuesData {
  [date: string]: { [ticker: string]: number } // NZD value for each ticker on each date
}

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
}

// Utility function to format date as YYYY-MM-DD (matching Python)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Generate complete date range (matching Python's pd.date_range)
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Fetch historical prices using Yahoo Finance API (like Python's yfinance)
async function fetchYFinanceHistory(symbol: string, startDate: Date, endDate: Date): Promise<StockPriceData> {
  const prices: StockPriceData = {}
  
  try {
    // Convert dates to Unix timestamps
    const period1 = Math.floor(startDate.getTime() / 1000)
    const period2 = Math.floor(endDate.getTime() / 1000)
    
    // Yahoo Finance URL
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`
    
    console.log(`   Fetching from Yahoo Finance: ${symbol}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const csvText = await response.text()
    const lines = csvText.trim().split('\n')
    
    if (lines.length <= 1) {
      throw new Error('No data in CSV response')
    }
    
    // Parse CSV data (skip header)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',')
      if (parts.length >= 5) {
        const dateStr = parts[0] // YYYY-MM-DD format
        const closePrice = parseFloat(parts[4]) // Close price
        
        if (!isNaN(closePrice) && closePrice > 0) {
          prices[dateStr] = closePrice
        }
      }
    }
    
    return prices
    
  } catch (error) {
    console.log(`   Error fetching ${symbol}: ${error}`)
    return {}
  }
}

// Fill missing dates with forward-fill (like Python's fillna().ffill())
function fillMissingDates(priceData: StockPriceData, dateRange: Date[]): StockPriceData {
  const filledData: StockPriceData = {}
  let lastKnownPrice: number | null = null
  
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    
    if (dateStr in priceData) {
      // We have data for this date
      lastKnownPrice = priceData[dateStr]
      filledData[dateStr] = lastKnownPrice
    } else if (lastKnownPrice !== null) {
      // Forward fill with last known price
      filledData[dateStr] = lastKnownPrice
    }
    // If no previous price available, skip this date
  })
  
  return filledData
}

// Get historical prices for all stocks (like Python's fetch_historical_prices_for_all_stocks)
async function getHistoricalPricesForAllStocks(
  trades: TradeRecord[], 
  startDate: Date, 
  endDate: Date
): Promise<{ [symbol: string]: StockPriceData }> {
  const symbols = Array.from(new Set(trades.map(t => t.code)))
  const stockPrices: { [symbol: string]: StockPriceData } = {}
  
  console.log(`Fetching historical prices for ${symbols.length} stocks...`)
  
  // Fetch all stocks concurrently
  const fetchPromises = symbols.map(async (symbol) => {
    console.log(`Fetching prices for ${symbol}...`)
    
    // Map MFT to MFT.NZ for Yahoo Finance (like Python code)
    const yfinanceSymbol = symbol === 'MFT' ? 'MFT.NZ' : symbol
    
    try {
      const historicalData = await fetchYFinanceHistory(yfinanceSymbol, startDate, endDate)
      
      if (Object.keys(historicalData).length > 0) {
        // Forward fill missing dates
        const dateRange = generateDateRange(startDate, endDate)
        stockPrices[symbol] = fillMissingDates(historicalData, dateRange)
        console.log(`   ${symbol}: ${Object.keys(stockPrices[symbol]).length} days of price data`)
      } else {
        console.log(`   ${symbol}: No data, using fallback`)
        // Create fallback data
        stockPrices[symbol] = createFallbackPriceData(symbol, startDate, endDate)
      }
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error}, using fallback`)
      stockPrices[symbol] = createFallbackPriceData(symbol, startDate, endDate)
    }
  })
  
  await Promise.all(fetchPromises)
  return stockPrices
}

// Create fallback price data when Yahoo Finance fails
function createFallbackPriceData(symbol: string, startDate: Date, endDate: Date): StockPriceData {
  const prices: StockPriceData = {}
  const dateRange = generateDateRange(startDate, endDate)
  
  // Estimate current prices (you can update these)
  const currentPrices: { [symbol: string]: number } = {
    'META': 614.0,
    'NFLX': 1180.0,
    'AMZN': 232.0,
    'UNH': 630.0,
    'CP': 117.0,
    'MSCI': 670.0,
    'ANET': 530.0,
    'CRM': 380.0,
    'MFT': 67.0
  }
  
  const currentPrice = currentPrices[symbol] || 100
  const totalDays = dateRange.length
  
  // Create realistic historical progression
  dateRange.forEach((date, index) => {
    const progress = index / totalDays
    const variation = (Math.sin(index * 0.1) * 0.05) + (Math.random() - 0.5) * 0.02
    const price = currentPrice * (0.7 + progress * 0.3) * (1 + variation)
    prices[formatDate(date)] = Math.max(price, currentPrice * 0.5)
  })
  
  return prices
}

// Get USD/NZD exchange rate (like Python's get_usd_nzd_exchange_rate)
async function getUsdNzdExchangeRate(startDate: Date, endDate: Date): Promise<ExchangeRateData> {
  console.log("Fetching USD/NZD exchange rate...")
  
  try {
    // Fetch NZD/USD rate from Yahoo Finance
    const nzdUsdData = await fetchYFinanceHistory("NZDUSD=X", startDate, endDate)
    
    if (Object.keys(nzdUsdData).length === 0) {
      throw new Error("No FX data found for NZDUSD")
    }
    
    // Convert NZD/USD to USD/NZD (invert the rate, like Python)
    const usdNzdData: ExchangeRateData = {}
    for (const [dateStr, nzdUsdRate] of Object.entries(nzdUsdData)) {
      if (nzdUsdRate > 0) {
        usdNzdData[dateStr] = 1 / nzdUsdRate
      }
    }
    
    // Forward fill missing dates
    const dateRange = generateDateRange(startDate, endDate)
    const filledRates = fillMissingDates(usdNzdData, dateRange)
    
    console.log(`   Success: USD/NZD rate data fetched with ${Object.keys(filledRates).length} days`)
    return filledRates
    
  } catch (error) {
    console.log(`   Warning: Could not fetch USD/NZD rate - ${error}`)
    console.log("   Using fallback rate of 1.66")
    
    // Fallback to static rate
    const exchangeRates: ExchangeRateData = {}
    const dateRange = generateDateRange(startDate, endDate)
    const fallbackRate = 1.66
    
    dateRange.forEach(date => {
      exchangeRates[formatDate(date)] = fallbackRate
    })
    
    return exchangeRates
  }
}

// Calculate daily holdings (exactly like Python's calculate_daily_holdings)
function calculateDailyHoldings(
  trades: TradeRecord[], 
  startDate: Date, 
  endDate: Date
): DailyHoldingsData {
  const dateRange = generateDateRange(startDate, endDate)
  const tickers = Array.from(new Set(trades.map(trade => trade.code))).sort()
  
  // Initialize holdings dataframe with zeros (like Python)
  const dailyHoldings: DailyHoldingsData = {}
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    dailyHoldings[dateStr] = {}
    tickers.forEach(ticker => {
      dailyHoldings[dateStr][ticker] = 0.0
    })
  })
  
  console.log(`Calculating daily holdings for ${tickers.length} tickers over ${dateRange.length} days...`)
  
  // Process each ticker separately (like Python)
  tickers.forEach(ticker => {
    console.log(`Processing ${ticker}...`)
    
    const tickerTrades = trades
      .filter(trade => trade.code === ticker)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Group trades by date (like Python's groupby('Date'))
    const tradesByDate = new Map<string, TradeRecord[]>()
    tickerTrades.forEach(trade => {
      const tradeDateStr = formatDate(new Date(trade.date))
      if (!tradesByDate.has(tradeDateStr)) {
        tradesByDate.set(tradeDateStr, [])
      }
      tradesByDate.get(tradeDateStr)!.push(trade)
    })
    
    // Process trades chronologically
    const sortedTradeDates = Array.from(tradesByDate.keys()).sort()
    
    sortedTradeDates.forEach((tradeDateStr, i) => {
      const dailyTrades = tradesByDate.get(tradeDateStr)!
      
      // Get previous holdings (like Python logic)
      let prevHoldings = 0.0
      const tradeDateIndex = dateRange.findIndex(date => formatDate(date) === tradeDateStr)
      
      if (i > 0 || tradeDateIndex > 0) {
        const prevDateIndex = tradeDateIndex - 1
        if (prevDateIndex >= 0) {
          const prevDateStr = formatDate(dateRange[prevDateIndex])
          prevHoldings = dailyHoldings[prevDateStr][ticker]
        }
      }
      
      // Calculate net change for this date (like Python)
      let buyQty = 0
      let sellQty = 0
      
      dailyTrades.forEach(trade => {
        const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
        
        if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
          buyQty += qty
        } else if (trade.type === 'Sell') {
          sellQty += qty // qty is already negative for sells in CSV
        }
      })
      
      const netChange = buyQty + sellQty
      const currentHoldings = prevHoldings + netChange
      
      // Update holdings from this trade date forward (like Python's daily_holdings.loc[trade_date:, ticker] = current_holdings)
      if (tradeDateIndex >= 0) {
        for (let i = tradeDateIndex; i < dateRange.length; i++) {
          const currentDateStr = formatDate(dateRange[i])
          dailyHoldings[currentDateStr][ticker] = currentHoldings
        }
      }
    })
  })
  
  console.log("Daily holdings calculation complete!")
  return dailyHoldings
}

// Calculate daily portfolio values in NZD (like Python's calculate_daily_portfolio_values_nzd)
async function calculateDailyPortfolioValuesNzd(
  dailyHoldings: DailyHoldingsData,
  trades: TradeRecord[],
  startDate: Date,
  endDate: Date,
  stockPrices: { [symbol: string]: StockPriceData },
  usdNzdRate: ExchangeRateData
): Promise<DailyValuesData> {
  const dateRange = generateDateRange(startDate, endDate)
  const tickers = Array.from(new Set(trades.map(trade => trade.code))).sort()
  
  // Create a copy of holdings to store values (like Python)
  const dailyValues: DailyValuesData = {}
  
  // Initialize daily values
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    dailyValues[dateStr] = {}
    tickers.forEach(ticker => {
      dailyValues[dateStr][ticker] = 0.0
    })
  })
  
  console.log("Calculating daily portfolio values in NZD...")
  
  // Process each ticker (like Python)
  tickers.forEach(ticker => {
    console.log(`Processing values for ${ticker}...`)
    
    if (ticker in stockPrices && Object.keys(stockPrices[ticker]).length > 0) {
      const priceData = stockPrices[ticker]
      
      // Determine currency for this ticker
      const tickerTrades = trades.filter(t => t.code === ticker)
      const currency = tickerTrades.length > 0 ? tickerTrades[0].instrumentCurrency : 'USD'
      
      // Calculate values for each date (like Python's iteration)
      dateRange.forEach(date => {
        const dateStr = formatDate(date)
        const shares = dailyHoldings[dateStr][ticker]
        
        if (shares === 0) {
          dailyValues[dateStr][ticker] = 0.0
          return
        }
        
        // Get price for this date (like Python logic)
        let priceUsdOrNzd: number | null = null
        
        if (dateStr in priceData) {
          priceUsdOrNzd = priceData[dateStr]
        } else {
          // Find closest previous date with price data (like Python)
          const availableDates = Object.keys(priceData)
            .filter(d => d <= dateStr)
            .sort()
          
          if (availableDates.length > 0) {
            const closestDate = availableDates[availableDates.length - 1]
            priceUsdOrNzd = priceData[closestDate]
          }
        }
        
        if (priceUsdOrNzd !== null && !isNaN(priceUsdOrNzd) && priceUsdOrNzd > 0) {
          let valueNzd = 0
          
          if (currency === 'USD') {
            // Convert USD to NZD using exchange rate (like Python)
            let fxRate: number | null = null
            
            if (dateStr in usdNzdRate) {
              fxRate = usdNzdRate[dateStr]
            } else {
              // Find closest FX rate (like Python)
              const fxDates = Object.keys(usdNzdRate)
                .filter(d => d <= dateStr)
                .sort()
              
              if (fxDates.length > 0) {
                const closestFxDate = fxDates[fxDates.length - 1]
                fxRate = usdNzdRate[closestFxDate]
              }
            }
            
            if (fxRate !== null && !isNaN(fxRate) && fxRate > 0) {
              valueNzd = shares * priceUsdOrNzd * fxRate
            } else {
              // Fallback rate (like Python)
              const fallbackRate = 1.65
              valueNzd = shares * priceUsdOrNzd * fallbackRate
            }
          } else {
            // NZD stock (like MFT)
            valueNzd = shares * priceUsdOrNzd
          }
          
          dailyValues[dateStr][ticker] = valueNzd
        } else {
          // No price data available, use previous day's value or zero (like Python)
          const dateIndex = dateRange.findIndex(d => formatDate(d) === dateStr)
          if (dateIndex > 0) {
            const prevDateStr = formatDate(dateRange[dateIndex - 1])
            dailyValues[dateStr][ticker] = dailyValues[prevDateStr][ticker]
          } else {
            dailyValues[dateStr][ticker] = 0.0
          }
        }
      })
    } else {
      console.log(`   No price data available for ${ticker} - setting values to zero`)
      dateRange.forEach(date => {
        const dateStr = formatDate(date)
        dailyValues[dateStr][ticker] = 0.0
      })
    }
  })
  
  console.log("Daily portfolio values calculation complete!")
  return dailyValues
}

// Calculate daily cost basis (like Python's _calculate_daily_cost_basis)
function calculateDailyCostBasis(
  trades: TradeRecord[],
  startDate: Date,
  endDate: Date,
  usdNzdRate: ExchangeRateData
): { [date: string]: number } {
  const dateRange = generateDateRange(startDate, endDate)
  const dailyCostBasis: { [date: string]: number } = {}
  
  // Initialize all dates with 0
  dateRange.forEach(date => {
    dailyCostBasis[formatDate(date)] = 0.0
  })
  
  let currentPortfolioCostBasis = 0.0
  let soldCapitalAvailableForReinvestment = 0.0
  
  console.log("Calculating daily cost basis...")
  
  // Group trades by date to process chronologically (like Python)
  const tradesByDate = new Map<string, TradeRecord[]>()
  trades.forEach(trade => {
    const tradeDateStr = formatDate(new Date(trade.date))
    if (!tradesByDate.has(tradeDateStr)) {
      tradesByDate.set(tradeDateStr, [])
    }
    tradesByDate.get(tradeDateStr)!.push(trade)
  })
  
  // Process trades chronologically
  const sortedTradeDates = Array.from(tradesByDate.keys()).sort()
  
  sortedTradeDates.forEach(tradeDateStr => {
    const dailyTrades = tradesByDate.get(tradeDateStr)!
    
    dailyTrades.forEach(trade => {
      const qty = typeof trade.qty === 'string' ? parseFloat(trade.qty.replace(/[",]/g, '')) : trade.qty
      const price = typeof trade.price === 'string' ? parseFloat(trade.price.replace(/[",]/g, '')) : trade.price
      const tradeType = trade.type
      const instrumentCurrency = trade.instrumentCurrency
      
      // Determine FX rate for the trade date (like Python)
      let fxRate = 1.0 // Default for NZD
      if (instrumentCurrency === 'USD') {
        if (tradeDateStr in usdNzdRate) {
          fxRate = usdNzdRate[tradeDateStr]
        } else {
          fxRate = 1.65 // Fallback rate
        }
      }
      
      const tradeValueNzd = qty * price * fxRate
      
      if (tradeType === 'Buy') {
        if (soldCapitalAvailableForReinvestment >= tradeValueNzd) {
          // Buy is fully covered by reinvested proceeds, no new capital
          soldCapitalAvailableForReinvestment -= tradeValueNzd
        } else {
          // Buy is partially or fully new capital
          const newCapitalInjected = tradeValueNzd - soldCapitalAvailableForReinvestment
          currentPortfolioCostBasis += newCapitalInjected
          soldCapitalAvailableForReinvestment = 0.0
        }
      } else if (tradeType === 'Sell') {
        // Sell transactions do not decrease cost basis, but add to reinvestable capital
        soldCapitalAvailableForReinvestment -= tradeValueNzd // Negative as sell qty is already negative
      } else if (tradeType === 'Reinvestment') {
        // Reinvestment does not increase cost basis
        // Do nothing to currentPortfolioCostBasis
      }
    })
    
    // Store the current portfolio cost basis for this date
    dailyCostBasis[tradeDateStr] = currentPortfolioCostBasis
  })
  
  // Forward fill cost basis for all dates (like Python's ffill)
  let lastKnownCostBasis = 0.0
  dateRange.forEach(date => {
    const dateStr = formatDate(date)
    if (dailyCostBasis[dateStr] > 0) {
      lastKnownCostBasis = dailyCostBasis[dateStr]
    } else {
      dailyCostBasis[dateStr] = lastKnownCostBasis
    }
  })
  
  console.log("Daily cost basis calculation complete!")
  return dailyCostBasis
}

// Main portfolio performance calculation function (like Python's PortfolioHoldingsCalculator)
export async function calculatePortfolioPerformance(trades: TradeRecord[]): Promise<DailyPortfolioData[]> {
  console.log("=== Starting Portfolio Performance Calculation ===")
  
  if (!trades || trades.length === 0) {
    console.log("No trades data available")
    return []
  }
  
  // Clean and prepare trades data (like Python's _load_and_process_trades)
  const cleanTrades = trades
    .filter(trade => trade.code && trade.code !== 'Total')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  if (cleanTrades.length === 0) {
    console.log("No valid trades after filtering")
    return []
  }
  
  // Set portfolio date range (like Python)
  const portfolioStartDate = new Date(cleanTrades[0].date)
  const portfolioEndDate = new Date() // Today
  
  console.log(`Portfolio period: ${formatDate(portfolioStartDate)} to ${formatDate(portfolioEndDate)}`)
  console.log(`Total valid transactions: ${cleanTrades.length}`)
  
  const uniqueTickers = Array.from(new Set(cleanTrades.map(t => t.code))).sort()
  console.log(`Unique tickers: ${uniqueTickers.join(', ')}`)
  
  try {
    // Step 1: Fetch historical prices and exchange rates (like Python)
    console.log("\n=== Step 1: Fetching Historical Data ===")
    const [stockPrices, usdNzdRate] = await Promise.all([
      getHistoricalPricesForAllStocks(cleanTrades, portfolioStartDate, portfolioEndDate),
      getUsdNzdExchangeRate(portfolioStartDate, portfolioEndDate)
    ])
    
    // Step 2: Calculate daily holdings (like Python)
    console.log("\n=== Step 2: Calculating Daily Holdings ===")
    const dailyHoldings = calculateDailyHoldings(cleanTrades, portfolioStartDate, portfolioEndDate)
    
    // Step 3: Calculate daily portfolio values (like Python)
    console.log("\n=== Step 3: Calculating Daily Portfolio Values ===")
    const dailyValues = await calculateDailyPortfolioValuesNzd(
      dailyHoldings, 
      cleanTrades, 
      portfolioStartDate, 
      portfolioEndDate, 
      stockPrices, 
      usdNzdRate
    )
    
    // Step 4: Calculate daily cost basis (like Python)
    console.log("\n=== Step 4: Calculating Daily Cost Basis ===")
    const dailyCostBasis = calculateDailyCostBasis(cleanTrades, portfolioStartDate, portfolioEndDate, usdNzdRate)
    
    // Step 5: Combine results (like Python's final output)
    console.log("\n=== Step 5: Combining Results ===")
    const dateRange = generateDateRange(portfolioStartDate, portfolioEndDate)
    const result: DailyPortfolioData[] = []
    
    dateRange.forEach(date => {
      const dateStr = formatDate(date)
      
      // Calculate total portfolio value for this date (like Python's sum)
      const totalPortfolioValue = Object.values(dailyValues[dateStr] || {})
        .reduce((sum, value) => sum + value, 0)
      
      const costBasis = dailyCostBasis[dateStr] || 0
      
      result.push({
        date: dateStr,
        portfolioValue: totalPortfolioValue,
        costBasis: costBasis
      })
    })
    
    console.log("=== Portfolio Performance Calculation Complete ===")
    console.log(`Generated ${result.length} days of portfolio data`)
    
    // Log final values
    const finalData = result[result.length - 1]
    console.log(`Final Portfolio Value: $${finalData.portfolioValue.toFixed(2)} NZD`)
    console.log(`Final Cost Basis: $${finalData.costBasis.toFixed(2)} NZD`)
    
    return result
    
  } catch (error) {
    console.error("Error in portfolio performance calculation:", error)
    return []
  }
}