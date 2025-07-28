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
  fiscalQuarter?: string
  reportType?: string
}

interface CompanyEarningsInfo {
  symbol: string
  irBaseUrl: string
  reportsUrl: string
  earningsPattern?: string
}

// Enhanced company information with actual earnings report URLs
const COMPANY_EARNINGS_INFO: Record<string, CompanyEarningsInfo> = {
  'AAPL': {
    symbol: 'AAPL',
    irBaseUrl: 'https://investor.apple.com',
    reportsUrl: 'https://investor.apple.com/investor-relations/default.aspx#tabs_content--2024',
    earningsPattern: 'https://www.apple.com/newsroom/{year}/{month:02d}/apple-reports-{quarter}-quarter-results/'
  },
  'MSFT': {
    symbol: 'MSFT',
    irBaseUrl: 'https://www.microsoft.com',
    reportsUrl: 'https://www.microsoft.com/en-us/investor/earnings/fy-{year}-{quarter}',
    earningsPattern: '/investor/earnings/fy-{year}-{quarter}'
  },
  'GOOGL': {
    symbol: 'GOOGL',
    irBaseUrl: 'https://abc.xyz',
    reportsUrl: 'https://abc.xyz/investor/',
    earningsPattern: '/investor/static/pdf/{year}{quarter}_alphabet_earnings_release.pdf'
  },
  'AMZN': {
    symbol: 'AMZN',
    irBaseUrl: 'https://ir.aboutamazon.com',
    reportsUrl: 'https://ir.aboutamazon.com/quarterly-results/default.aspx',
    earningsPattern: '/news-release/news-release-details/{year}/amazon-com-announces-{quarter}-quarter-results'
  },
  'NVDA': {
    symbol: 'NVDA',
    irBaseUrl: 'https://investor.nvidia.com',
    reportsUrl: 'https://investor.nvidia.com/financial-info/quarterly-results/default.aspx',
    earningsPattern: '/financial-info/financial-reports/'
  },
  'META': {
    symbol: 'META',
    irBaseUrl: 'https://investor.fb.com',
    reportsUrl: 'https://investor.fb.com/investor-events/default.aspx',
    earningsPattern: '/investor-news/press-release-details/{year}/meta-reports-{quarter}-quarter-{year}-results'
  },
  'TSLA': {
    symbol: 'TSLA',
    irBaseUrl: 'https://ir.tesla.com',
    reportsUrl: 'https://ir.tesla.com/',
    earningsPattern: '/{year}-{quarter}-quarterly-update'
  },
  'BRK.B': {
    symbol: 'BRK-B',
    irBaseUrl: 'https://www.berkshirehathaway.com',
    reportsUrl: 'https://www.berkshirehathaway.com/reports.html',
    earningsPattern: '/qtrly/qtrly{year}{quarter}.pdf'
  },
  'V': {
    symbol: 'V',
    irBaseUrl: 'https://investor.visa.com',
    reportsUrl: 'https://investor.visa.com/financial-information/quarterly-earnings/default.aspx',
    earningsPattern: '/financial-information/quarterly-earnings/{year}/{quarter}'
  },
  'MA': {
    symbol: 'MA',
    irBaseUrl: 'https://investor.mastercard.com',
    reportsUrl: 'https://investor.mastercard.com/investor-relations/financials/quarterly-results/default.aspx',
    earningsPattern: '/investor-relations/investor-news/press-release-details/{year}/Mastercard-Incorporated-Reports-{quarter}-Quarter-{year}-Financial-Results'
  },
  'ASML': {
    symbol: 'ASML',
    irBaseUrl: 'https://www.asml.com',
    reportsUrl: 'https://www.asml.com/en/investors/financial-results',
    earningsPattern: '/en/investors/financial-calendar/{year}'
  },
  'UBER': {
    symbol: 'UBER',
    irBaseUrl: 'https://investor.uber.com',
    reportsUrl: 'https://investor.uber.com/financials/default.aspx',
    earningsPattern: '/news-events/news/press-release-details/{year}/uber-announces-results-{quarter}-quarter-{year}'
  },
  'MFT': {
    symbol: 'MFT',
    irBaseUrl: 'https://www.mainfreight.com',
    reportsUrl: 'https://www.mainfreight.com/investor-centre',
    earningsPattern: '/investor-centre'
  }
}

function generateHistoricalReports(symbol: string, companyInfo: CompanyEarningsInfo): EarningsReport[] {
  const reports: EarningsReport[] = []
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)
  
  // Generate reports for the last 5 years (20 quarters)
  for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
    const year = currentYear - yearOffset
    
    for (let q = 4; q >= 1; q--) {
      // Skip future quarters
      if (year === currentYear && q > currentQuarter) continue
      
      // Generate the report date (approximate - last month of quarter)
      const reportMonth = q * 3
      const reportDate = new Date(year, reportMonth - 1, 1)
      
      // Skip if report date is in the future
      if (reportDate > new Date()) continue
      
      // Determine fiscal year and quarter (some companies have different fiscal years)
      let fiscalYear = year
      let fiscalQuarter = `Q${q}`
      
      // Apple has a September fiscal year end
      if (symbol === 'AAPL' && q === 1) {
        fiscalYear = year
        fiscalQuarter = 'Q1'
      } else if (symbol === 'AAPL') {
        fiscalQuarter = `Q${q}`
      }
      
      // Microsoft has a June fiscal year end
      if (symbol === 'MSFT') {
        if (q <= 2) {
          fiscalYear = year
          fiscalQuarter = `Q${q + 2}`
        } else {
          fiscalYear = year + 1
          fiscalQuarter = `Q${q - 2}`
        }
      }
      
      const quarterNames = ['First', 'Second', 'Third', 'Fourth']
      const quarterName = quarterNames[q - 1]
      
      reports.push({
        symbol,
        date: reportDate.toISOString(),
        title: `${symbol} ${fiscalQuarter} ${fiscalYear} Earnings Report`,
        url: companyInfo.reportsUrl,
        quarter: `Q${q}`,
        year: year.toString(),
        fiscalQuarter: `${fiscalQuarter} ${fiscalYear}`,
        reportType: 'Quarterly Earnings'
      })
    }
  }
  
  return reports
}

export async function getEnhancedEarningsData(
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
      // Adjust symbol for Yahoo Finance
      let yahooSymbol = symbol
      if (symbol === 'MFT') {
        yahooSymbol = 'MFT.NZ'
      } else if (symbol === 'BRK.B') {
        yahooSymbol = 'BRK-B'
      }
      
      // Get earnings date from Yahoo Finance
      try {
        const quote = await yahooFinance.quote(yahooSymbol)
        
        let earningsDate: string | null = null
        let isConfirmed = false
        
        if (quote.earningsTimestamp) {
          // Yahoo Finance returns seconds, not milliseconds
          const timestamp = quote.earningsTimestamp
          // Check if timestamp is reasonable (between 2020 and 2030)
          const date = new Date(timestamp * 1000)
          if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
            earningsDate = date.toISOString()
            isConfirmed = true
          }
        } else if (quote.earningsTimestampStart) {
          const timestamp = quote.earningsTimestampStart
          const date = new Date(timestamp * 1000)
          if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
            earningsDate = date.toISOString()
            isConfirmed = false
          }
        }
        
        nextEarnings.push({
          symbol,
          name,
          date: earningsDate,
          isConfirmed,
          source: 'Yahoo Finance'
        })
      } catch (error) {
        logger.warn(`Could not get earnings date for ${symbol}:`, error)
        nextEarnings.push({
          symbol,
          name,
          date: null,
          isConfirmed: false,
          source: 'Not available'
        })
      }
      
      // Generate historical reports
      const companyInfo = COMPANY_EARNINGS_INFO[symbol]
      if (companyInfo) {
        historicalReports[symbol] = generateHistoricalReports(symbol, companyInfo)
      } else {
        // Fallback for companies not in our mapping
        historicalReports[symbol] = generateHistoricalReports(symbol, {
          symbol,
          irBaseUrl: '#',
          reportsUrl: '#',
        })
      }
      
    } catch (error) {
      logger.error(`Error processing ${symbol}:`, error)
      nextEarnings.push({
        symbol,
        name,
        date: null,
        isConfirmed: false,
        source: 'Error'
      })
    }
    
    // Small delay to avoid rate limiting
    if (i < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // Sort next earnings by date
  nextEarnings.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
  
  return { nextEarnings, historicalReports }
}