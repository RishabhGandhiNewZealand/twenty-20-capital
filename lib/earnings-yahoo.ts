import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'

interface EarningsDate {
  symbol: string
  name: string
  date: string | null
  isConfirmed: boolean
  source: string
}

interface EarningsReport {
  symbol: string
  date: string
  title: string
  url: string
  quarter: string
  year: string
}

export async function getEarningsFromYahoo(
  symbols: string[],
  names: string[]
): Promise<{
  nextEarnings: EarningsDate[],
  historicalReports: Record<string, EarningsReport[]>
}> {
  const nextEarnings: EarningsDate[] = []
  const historicalReports: Record<string, EarningsReport[]> = {}
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]
    const name = names[i]
    
    try {
      // Adjust symbol for special cases
      let yahooSymbol = symbol
      if (symbol === 'MFT') {
        yahooSymbol = 'MFT.NZ'
      }
      
      // Get quote data which includes earnings date
      const quote = await yahooFinance.quote(yahooSymbol)
      
      // Extract earnings date
      let earningsDate: string | null = null
      let isConfirmed = false
      
      if (quote.earningsTimestamp) {
        earningsDate = new Date(quote.earningsTimestamp * 1000).toISOString()
        isConfirmed = true
      } else if (quote.earningsTimestampStart) {
        earningsDate = new Date(quote.earningsTimestampStart * 1000).toISOString()
        isConfirmed = false
      }
      
      nextEarnings.push({
        symbol,
        name,
        date: earningsDate,
        isConfirmed,
        source: 'Yahoo Finance'
      })
      
      // Get historical earnings data
      try {
        const options = await yahooFinance.options(yahooSymbol)
        
        // Yahoo Finance doesn't provide direct access to earnings reports
        // But we can construct URLs to likely earnings pages
        const irUrls: Record<string, string> = {
          'AAPL': 'https://investor.apple.com/investor-relations/default.aspx',
          'MSFT': 'https://www.microsoft.com/en-us/investor/earnings/fy-2024',
          'GOOGL': 'https://abc.xyz/investor/',
          'AMZN': 'https://ir.aboutamazon.com/quarterly-results/default.aspx',
          'NVDA': 'https://investor.nvidia.com/financial-info/quarterly-results/default.aspx',
          'META': 'https://investor.fb.com/financials/default.aspx',
          'TSLA': 'https://ir.tesla.com/',
          'BRK.B': 'https://www.berkshirehathaway.com/reports.html',
          'V': 'https://investor.visa.com/financial-information/quarterly-earnings/default.aspx',
          'MA': 'https://investor.mastercard.com/investor-relations/financials/quarterly-results/default.aspx',
          'ASML': 'https://www.asml.com/en/investors/financial-results',
          'UBER': 'https://investor.uber.com/financials/default.aspx',
          'MFT': 'https://www.mainfreight.com/investor-centre'
        }
        
        // Create placeholder historical reports with links to IR pages
        if (irUrls[symbol]) {
          const reports: EarningsReport[] = []
          const currentYear = new Date().getFullYear()
          const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
          
          // Generate last 8 quarters
          for (let q = 0; q < 8; q++) {
            let quarter = currentQuarter - q
            let year = currentYear
            
            if (quarter <= 0) {
              quarter += 4
              year--
            }
            
            reports.push({
              symbol,
              date: new Date(year, (quarter - 1) * 3, 1).toISOString(),
              title: `${symbol} Q${quarter} ${year} Earnings`,
              url: irUrls[symbol],
              quarter: `Q${quarter}`,
              year: year.toString()
            })
          }
          
          historicalReports[symbol] = reports
        }
      } catch (e) {
        logger.warn(`Could not get historical data for ${symbol}`)
      }
      
    } catch (error) {
      logger.error(`Error fetching Yahoo Finance data for ${symbol}:`, error)
      nextEarnings.push({
        symbol,
        name,
        date: null,
        isConfirmed: false,
        source: 'Error'
      })
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  // Sort by date
  nextEarnings.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
  
  return { nextEarnings, historicalReports }
}