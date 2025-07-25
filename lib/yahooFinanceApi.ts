import axios from 'axios'

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: any
      timestamp: number[]
      indicators: {
        quote: Array<{
          close: number[]
          high: number[]
          low: number[]
          open: number[]
          volume: number[]
        }>
      }
    }>
  }
}

interface PriceData {
  [date: string]: number
}

// Mimic the Python get_daily_historical_prices function
export async function getHistoricalPrices(
  tickerSymbol: string, 
  startDate: string, 
  endDate: string
): Promise<PriceData> {
  try {
    // Handle special cases like MFT -> MFT.NZ (following Python logic)
    let yahooTickerSymbol = tickerSymbol
    if (tickerSymbol === "MFT") {
      yahooTickerSymbol = "MFT.NZ"
    }

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTickerSymbol}`
    const params = {
      period1: startTimestamp,
      period2: endTimestamp,
      interval: '1d',
      includePrePost: false,
      events: 'div,splits'
    }

    console.log(`Fetching data for ${yahooTickerSymbol} from ${startDate} to ${endDate}`)
    
    const response = await axios.get<YahooFinanceResponse>(url, { 
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000 // 30 second timeout
    })

    if (!response.data?.chart?.result?.[0]) {
      throw new Error(`No data found for ${yahooTickerSymbol}`)
    }

    const result = response.data.chart.result[0]
    const timestamps = result.timestamp
    const closes = result.indicators.quote[0].close

    if (!timestamps || !closes || timestamps.length !== closes.length) {
      throw new Error(`Invalid data structure for ${yahooTickerSymbol}`)
    }

    const priceData: PriceData = {}
    
    for (let i = 0; i < timestamps.length; i++) {
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
      const closePrice = closes[i]
      
      // Only include valid prices (not null/undefined)
      if (closePrice !== null && closePrice !== undefined && !isNaN(closePrice)) {
        priceData[date] = closePrice
      }
    }

    console.log(`Successfully fetched ${Object.keys(priceData).length} price points for ${yahooTickerSymbol}`)
    
    if (Object.keys(priceData).length === 0) {
      throw new Error(`No valid price data for ${yahooTickerSymbol}`)
    }

    return priceData
  } catch (error) {
    console.error(`Error fetching data for ${tickerSymbol}:`, error)
    throw error
  }
}

// Mimic the Python get_usd_nzd_exchange_rate function
export async function getUSDNZDExchangeRate(
  startDate: string, 
  endDate: string
): Promise<PriceData> {
  try {
    // Use NZDUSD=X ticker to get NZD/USD rate, then invert to get USD/NZD
    const nzdUsdData = await getHistoricalPrices("NZDUSD=X", startDate, endDate)
    
    // Convert NZD/USD to USD/NZD (invert the rate)
    const usdNzdData: PriceData = {}
    
    for (const [date, nzdUsdRate] of Object.entries(nzdUsdData)) {
      if (nzdUsdRate > 0) {
        usdNzdData[date] = 1 / nzdUsdRate
      }
    }

    console.log(`Successfully fetched ${Object.keys(usdNzdData).length} exchange rate points`)
    
    return usdNzdData
  } catch (error) {
    console.error('Error fetching USD/NZD exchange rate:', error)
    throw error
  }
}

// Helper function to fill missing dates (forward fill)
export function fillMissingDates(
  priceData: PriceData, 
  startDate: string, 
  endDate: string
): PriceData {
  if (!priceData || Object.keys(priceData).length === 0) {
    return priceData
  }

  const filledData: PriceData = {}
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let lastKnownPrice = 0
  const currentDate = new Date(start)
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    if (priceData[dateStr] !== undefined) {
      lastKnownPrice = priceData[dateStr]
      filledData[dateStr] = priceData[dateStr]
    } else if (lastKnownPrice > 0) {
      // Forward fill with last known price
      filledData[dateStr] = lastKnownPrice
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return filledData
}