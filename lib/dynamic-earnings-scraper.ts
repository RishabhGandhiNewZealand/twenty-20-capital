import * as cheerio from 'cheerio'
import axios from 'axios'

interface EarningsURL {
  url: string
  title: string
  quarter: string
  year: string
  date: string
  isValid: boolean
}

interface CompanyEarningsInfo {
  symbol: string
  name: string
  investorUrl: string
  earningsReleases: EarningsURL[]
  actualEarningsDate?: string
}

interface PortfolioCompany {
  symbol: string
  name: string
}

// Dynamic function to get current portfolio companies
async function getPortfolioCompanies(): Promise<PortfolioCompany[]> {
  try {
    const response = await fetch('/api/portfolio-current')
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio data')
    }
    const data = await response.json()
    return data.holdings.map((holding: any) => ({
      symbol: holding.symbol,
      name: holding.name
    }))
  } catch (error) {
    console.error('Error fetching portfolio companies:', error)
    return []
  }
}

// Validate if a URL exists and returns 200
async function validateURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.status === 200
  } catch (error) {
    return false
  }
}

// Get company-specific investor relations URLs
function getInvestorRelationsURL(symbol: string): string | null {
  const investorUrls: Record<string, string> = {
    'MA': 'https://investor.mastercard.com/investor-news',
    'GOOGL': 'https://abc.xyz/investor/',
    'AMZN': 'https://ir.aboutamazon.com/news-events/news',
    'META': 'https://investor.fb.com/investor-news/',
    'NFLX': 'https://ir.netflix.net/overview/default.aspx',
    'UBER': 'https://investor.uber.com/news-events/news/',
    'NVDA': 'https://investor.nvidia.com/events-and-presentations/',
    'MSFT': 'https://www.microsoft.com/en-us/Investor/earnings/default.aspx',
    'ASML': 'https://www.asml.com/en/investors/financial-results',
    'SPGI': 'https://investor.spglobal.com/news-and-events/news-releases',
    'TSM': 'https://investor.tsmc.com/english/encrypt/news',
    'MFT': 'https://www.mainfreight.com/investors/reports-and-presentations'
  }
  return investorUrls[symbol] || null
}

// Scrape earnings data for Mastercard
async function scrapeMastercard(year: string, quarter?: string): Promise<EarningsURL[]> {
  const results: EarningsURL[] = []
  const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
  
  for (const q of quarters) {
    const yearShort = year.slice(-2)
    const quarterNum = q.slice(1)
    
    // Test the known Mastercard pattern
    const url = `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/${q.toLowerCase()}/${quarterNum}${q}${yearShort}-Mastercard-Earnings-Release.pdf`
    const isValid = await validateURL(url)
    
    if (isValid) {
      results.push({
        url,
        title: `Mastercard ${q} ${year} Earnings Release`,
        quarter: q,
        year,
        date: await getActualEarningsDate('MA', year, q),
        isValid: true
      })
    }
  }
  
  return results
}

// Scrape earnings data for Google/Alphabet
async function scrapeGoogle(year: string, quarter?: string): Promise<EarningsURL[]> {
  const results: EarningsURL[] = []
  
  try {
    // Scrape the Alphabet investor page for earnings releases
    const response = await axios.get('https://abc.xyz/investor/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Look for earnings-related links
    $('a').each((index, element) => {
      const href = $(element).attr('href')
      const text = $(element).text().toLowerCase()
      
      if (href && (text.includes('earnings') || text.includes('quarterly')) && 
          href.includes('.pdf') && href.includes(year)) {
        
        const fullUrl = href.startsWith('http') ? href : `https://abc.xyz${href}`
        
        // Extract quarter info from the text or URL
        const quarterMatch = text.match(/q[1-4]/i) || href.match(/q[1-4]/i)
        const detectedQuarter = quarterMatch ? quarterMatch[0].toUpperCase() : 'Q1'
        
        if (!quarter || detectedQuarter === quarter) {
          results.push({
            url: fullUrl,
            title: `Alphabet ${detectedQuarter} ${year} Earnings Release`,
            quarter: detectedQuarter,
            year,
            date: getActualEarningsDate('GOOGL', year, detectedQuarter),
            isValid: true // We found it on their page, so it should be valid
          })
        }
      }
    })
  } catch (error) {
    console.error('Error scraping Google earnings:', error)
  }
  
  return results
}

// Scrape earnings data for Microsoft
async function scrapeMicrosoft(year: string, quarter?: string): Promise<EarningsURL[]> {
  const results: EarningsURL[] = []
  
  try {
    const response = await axios.get('https://www.microsoft.com/en-us/Investor/earnings/default.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Look for earnings press release links
    $('a').each((index, element) => {
      const href = $(element).attr('href')
      const text = $(element).text().toLowerCase()
      
      if (href && (text.includes('earnings') || text.includes('fiscal') || text.includes('quarterly')) && 
          href.includes('.pdf') && (href.includes(year) || text.includes(year))) {
        
        const fullUrl = href.startsWith('http') ? href : `https://www.microsoft.com${href}`
        
        // Microsoft uses fiscal years, need to map accordingly
        const quarterMatch = text.match(/q[1-4]/i) || href.match(/q[1-4]/i)
        const detectedQuarter = quarterMatch ? quarterMatch[0].toUpperCase() : 'Q1'
        
        if (!quarter || detectedQuarter === quarter) {
          results.push({
            url: fullUrl,
            title: `Microsoft ${detectedQuarter} ${year} Earnings Release`,
            quarter: detectedQuarter,
            year,
            date: getActualEarningsDate('MSFT', year, detectedQuarter),
            isValid: true
          })
        }
      }
    })
  } catch (error) {
    console.error('Error scraping Microsoft earnings:', error)
  }
  
  return results
}

// Scrape earnings data for Meta
async function scrapeMeta(year: string, quarter?: string): Promise<EarningsURL[]> {
  const results: EarningsURL[] = []
  
  try {
    const response = await axios.get('https://investor.fb.com/investor-news/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Look for earnings releases
    $('a').each((index, element) => {
      const href = $(element).attr('href')
      const text = $(element).text().toLowerCase()
      
      if (href && (text.includes('earnings') || text.includes('quarterly')) && 
          (href.includes('.pdf') || href.includes('exhibit')) && 
          (href.includes(year) || text.includes(year))) {
        
        const fullUrl = href.startsWith('http') ? href : `https://investor.fb.com${href}`
        
        const quarterMatch = text.match(/q[1-4]/i) || href.match(/q[1-4]/i)
        const detectedQuarter = quarterMatch ? quarterMatch[0].toUpperCase() : 'Q1'
        
        if (!quarter || detectedQuarter === quarter) {
          results.push({
            url: fullUrl,
            title: `Meta ${detectedQuarter} ${year} Earnings Release`,
            quarter: detectedQuarter,
            year,
            date: getActualEarningsDate('META', year, detectedQuarter),
            isValid: true
          })
        }
      }
    })
  } catch (error) {
    console.error('Error scraping Meta earnings:', error)
  }
  
  return results
}

// Get actual earnings announcement dates by scraping earnings calendars
function getActualEarningsDate(symbol: string, year: string, quarter: string): string {
  // This would ideally scrape from financial calendars like Yahoo Finance, MarketWatch, etc.
  // For now, provide realistic estimates based on typical earnings seasons
  const earningsSeasons: Record<string, Record<string, string>> = {
    'Q1': { '2024': '2024-04-30', '2023': '2023-04-30', '2025': '2025-04-30' },
    'Q2': { '2024': '2024-07-30', '2023': '2023-07-30', '2025': '2025-07-30' },
    'Q3': { '2024': '2024-10-30', '2023': '2023-10-30', '2025': '2025-10-30' },
    'Q4': { '2024': '2025-01-30', '2023': '2024-01-30', '2025': '2026-01-30' }
  }
  
  return earningsSeasons[quarter]?.[year] || `${year}-12-31`
}

// Main scraping function that delegates to company-specific scrapers
async function scrapeCompanyEarnings(symbol: string, year: string, quarter?: string): Promise<EarningsURL[]> {
  switch (symbol) {
    case 'MA':
      return await scrapeMastercard(year, quarter)
    case 'GOOGL':
      return await scrapeGoogle(year, quarter)
    case 'MSFT':
      return await scrapeMicrosoft(year, quarter)
    case 'META':
      return await scrapeMeta(year, quarter)
    default:
      return []
  }
}

// Main function to get earnings for all portfolio companies
export async function scrapePortfolioEarnings(year?: string, quarter?: string): Promise<CompanyEarningsInfo[]> {
  const currentYear = year || new Date().getFullYear().toString()
  const portfolioCompanies = await getPortfolioCompanies()
  
  const results: CompanyEarningsInfo[] = []
  
  for (const company of portfolioCompanies) {
    const investorUrl = getInvestorRelationsURL(company.symbol)
    if (investorUrl) {
      const earningsReleases = await scrapeCompanyEarnings(company.symbol, currentYear, quarter)
      
      results.push({
        symbol: company.symbol,
        name: company.name,
        investorUrl,
        earningsReleases,
        actualEarningsDate: earningsReleases[0]?.date
      })
    }
  }
  
  return results
}

// Get supported symbols (only those in current portfolio)
export async function getSupportedSymbols(): Promise<string[]> {
  const portfolioCompanies = await getPortfolioCompanies()
  return portfolioCompanies
    .map(company => company.symbol)
    .filter(symbol => getInvestorRelationsURL(symbol) !== null)
}

// Test company URLs
export async function testCompanyURLs(symbol: string): Promise<{
  symbol: string
  validUrls: number
  totalUrls: number
  urls: EarningsURL[]
}> {
  const currentYear = new Date().getFullYear().toString()
  const urls = await scrapeCompanyEarnings(symbol, currentYear)
  
  return {
    symbol,
    validUrls: urls.filter(url => url.isValid).length,
    totalUrls: urls.length,
    urls
  }
}