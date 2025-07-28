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

interface CompanyIRInfo {
  symbol: string
  name: string
  irUrl?: string
  earningsUrl?: string
}

// Map of company symbols to their investor relations URLs
const COMPANY_IR_URLS: Record<string, { irUrl: string, earningsPath?: string }> = {
  'AAPL': { 
    irUrl: 'https://investor.apple.com',
    earningsPath: '/investor-relations/default.aspx'
  },
  'MSFT': { 
    irUrl: 'https://www.microsoft.com/en-us/investor',
    earningsPath: '/earnings/fy-2024-q1'
  },
  'GOOGL': { 
    irUrl: 'https://abc.xyz/investor/',
    earningsPath: ''
  },
  'AMZN': { 
    irUrl: 'https://ir.aboutamazon.com',
    earningsPath: '/quarterly-results/default.aspx'
  },
  'NVDA': {
    irUrl: 'https://investor.nvidia.com',
    earningsPath: '/financial-info/financial-reports'
  },
  'META': {
    irUrl: 'https://investor.fb.com',
    earningsPath: '/financials/default.aspx'
  },
  'TSLA': {
    irUrl: 'https://ir.tesla.com',
    earningsPath: ''
  },
  'BRK.B': {
    irUrl: 'https://www.berkshirehathaway.com',
    earningsPath: '/reports.html'
  },
  'V': {
    irUrl: 'https://investor.visa.com',
    earningsPath: '/financial-information/quarterly-earnings'
  },
  'MA': {
    irUrl: 'https://investor.mastercard.com',
    earningsPath: '/investor-relations/financials/quarterly-results/default.aspx'
  },
  'ASML': {
    irUrl: 'https://www.asml.com/en/investors',
    earningsPath: '/financial-results'
  },
  'UBER': {
    irUrl: 'https://investor.uber.com',
    earningsPath: '/financials/default.aspx'
  },
  'MFT': {
    irUrl: 'https://www.mainfreight.com',
    earningsPath: '/investor-centre'
  }
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    logger.error(`Error fetching ${url}:`, error)
    return null
  }
}

async function scrapeCompanyEarnings(symbol: string, name: string): Promise<{
  nextEarning: EarningsDate | null,
  historicalReports: EarningsReport[]
}> {
  const companyInfo = COMPANY_IR_URLS[symbol]
  
  if (!companyInfo) {
    logger.warn(`No IR URL configured for ${symbol}`)
    return {
      nextEarning: {
        symbol,
        name,
        date: null,
        isConfirmed: false,
        source: 'Not configured'
      },
      historicalReports: []
    }
  }
  
  try {
    // For now, we'll use a simplified approach
    // In a production environment, you'd want to use a proper web scraping library
    // like Puppeteer or Playwright to handle JavaScript-rendered content
    
    const response = await fetchWithTimeout(companyInfo.irUrl)
    if (!response || !response.ok) {
      throw new Error(`Failed to fetch IR page for ${symbol}`)
    }
    
    const html = await response.text()
    
    // Extract earnings date (this is a simplified example)
    // In reality, you'd need to parse the specific structure of each company's IR page
    const nextEarning: EarningsDate = {
      symbol,
      name,
      date: extractEarningsDate(html, symbol),
      isConfirmed: false,
      source: companyInfo.irUrl
    }
    
    // Extract historical reports
    const historicalReports = extractHistoricalReports(html, symbol, companyInfo.irUrl)
    
    return { nextEarning, historicalReports }
  } catch (error) {
    logger.error(`Error scraping earnings for ${symbol}:`, error)
    return {
      nextEarning: {
        symbol,
        name,
        date: null,
        isConfirmed: false,
        source: 'Error'
      },
      historicalReports: []
    }
  }
}

function extractEarningsDate(html: string, symbol: string): string | null {
  // This is a placeholder - actual implementation would parse the HTML
  // and extract the earnings date based on the specific structure of each IR page
  
  // Common patterns to look for:
  // - "Next earnings: DATE"
  // - "Q1 2024 Earnings: DATE"
  // - Calendar widgets with highlighted dates
  
  const patterns = [
    /earnings[^>]*>([^<]*\d{4})/i,
    /earnings.*?(\w+\s+\d{1,2},?\s+\d{4})/i,
    /results.*?(\w+\s+\d{1,2},?\s+\d{4})/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      try {
        const date = new Date(match[1])
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  return null
}

function extractHistoricalReports(html: string, symbol: string, baseUrl: string): EarningsReport[] {
  const reports: EarningsReport[] = []
  
  // Look for links to earnings reports
  // This is a simplified example - actual implementation would be more sophisticated
  const linkPattern = /<a[^>]*href=["']([^"']*(?:earnings|results|report)[^"']*\.pdf)["'][^>]*>([^<]+)</gi
  
  let match
  while ((match = linkPattern.exec(html)) !== null) {
    const [, url, title] = match
    
    // Extract quarter and year from title
    const quarterMatch = title.match(/Q(\d)\s+(\d{4})|(\w+)\s+Quarter\s+(\d{4})/i)
    if (quarterMatch) {
      const quarter = quarterMatch[1] || quarterMatch[3]
      const year = quarterMatch[2] || quarterMatch[4]
      
      reports.push({
        symbol,
        date: new Date().toISOString(), // Would extract actual date from content
        title: title.trim(),
        url: url.startsWith('http') ? url : `${baseUrl}${url}`,
        quarter: `Q${quarter}`,
        year
      })
    }
  }
  
  // Sort by date descending
  reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Return only the last 8 quarters
  return reports.slice(0, 8)
}

export async function scrapeEarningsData(
  symbols: string[], 
  names: string[]
): Promise<{
  nextEarnings: EarningsDate[],
  historicalReports: Record<string, EarningsReport[]>
}> {
  const nextEarnings: EarningsDate[] = []
  const historicalReports: Record<string, EarningsReport[]> = {}
  
  // Process each company
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]
    const name = names[i]
    
    const { nextEarning, historicalReports: reports } = await scrapeCompanyEarnings(symbol, name)
    
    if (nextEarning) {
      nextEarnings.push(nextEarning)
    }
    
    if (reports.length > 0) {
      historicalReports[symbol] = reports
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Sort next earnings by date
  nextEarnings.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
  
  return { nextEarnings, historicalReports }
}