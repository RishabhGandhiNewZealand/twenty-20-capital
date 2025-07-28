import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
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

// Enhanced company-specific scraping configurations
const COMPANY_SCRAPING_CONFIG = {
  'AAPL': {
    irUrl: 'https://investor.apple.com',
    earningsSelector: '.module-event-upcoming',
    reportsSelector: 'a[href*="earnings"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'MSFT': {
    irUrl: 'https://www.microsoft.com/en-us/investor',
    earningsSelector: '.c-calendar-event',
    reportsSelector: 'a[href*="earnings"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'GOOGL': {
    irUrl: 'https://abc.xyz/investor/',
    earningsSelector: '.earnings-date',
    reportsSelector: 'a[href*="earnings"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'AMZN': {
    irUrl: 'https://ir.aboutamazon.com',
    earningsSelector: '.event-date',
    reportsSelector: 'a[href*="quarterly-results"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'NVDA': {
    irUrl: 'https://investor.nvidia.com',
    earningsSelector: '.event-item',
    reportsSelector: 'a[href*="financial-reports"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'META': {
    irUrl: 'https://investor.fb.com',
    earningsSelector: '.event-date',
    reportsSelector: 'a[href*="earnings"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'TSLA': {
    irUrl: 'https://ir.tesla.com',
    earningsSelector: '.event-item',
    reportsSelector: 'a[href*="quarterly"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'V': {
    irUrl: 'https://investor.visa.com',
    earningsSelector: '.event-date',
    reportsSelector: 'a[href*="earnings"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'MA': {
    irUrl: 'https://investor.mastercard.com',
    earningsSelector: '.event-item',
    reportsSelector: 'a[href*="quarterly-results"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'ASML': {
    irUrl: 'https://www.asml.com/en/investors',
    earningsSelector: '.event-date',
    reportsSelector: 'a[href*="results"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  },
  'UBER': {
    irUrl: 'https://investor.uber.com',
    earningsSelector: '.event-item',
    reportsSelector: 'a[href*="results"]',
    datePattern: /(\w+\s+\d{1,2},?\s+\d{4})/
  }
}

let browser: puppeteer.Browser | null = null

async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  return browser
}

async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

async function scrapeWithPuppeteer(url: string): Promise<string | null> {
  try {
    const browserInstance = await getBrowser()
    const page = await browserInstance.newPage()
    
    // Set a reasonable timeout
    await page.setDefaultTimeout(30000)
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000)
    
    // Get the page content
    const content = await page.content()
    
    await page.close()
    
    return content
  } catch (error) {
    logger.error(`Error scraping ${url} with Puppeteer:`, error)
    return null
  }
}

function parseEarningsDate(html: string, config: any): string | null {
  const $ = cheerio.load(html)
  
  // Try to find earnings date using the selector
  const earningsElement = $(config.earningsSelector).first()
  if (earningsElement.length) {
    const text = earningsElement.text()
    const match = text.match(config.datePattern)
    if (match) {
      try {
        const date = new Date(match[1])
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date.toISOString()
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  // Fallback: search for common patterns in the entire page
  const patterns = [
    /next earnings.*?(\w+\s+\d{1,2},?\s+\d{4})/i,
    /earnings call.*?(\w+\s+\d{1,2},?\s+\d{4})/i,
    /q\d\s+\d{4}.*?(\w+\s+\d{1,2},?\s+\d{4})/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      try {
        const date = new Date(match[1])
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date.toISOString()
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  return null
}

function parseHistoricalReports(html: string, symbol: string, config: any): EarningsReport[] {
  const $ = cheerio.load(html)
  const reports: EarningsReport[] = []
  
  // Find report links using the selector
  $(config.reportsSelector).each((_, element) => {
    const $el = $(element)
    const href = $el.attr('href')
    const text = $el.text().trim()
    
    if (href && text) {
      // Extract quarter and year
      const quarterMatch = text.match(/Q(\d)\s+(\d{4})|(\w+)\s+Quarter\s+(\d{4})/i)
      if (quarterMatch) {
        const quarter = quarterMatch[1] || quarterMatch[3]
        const year = quarterMatch[2] || quarterMatch[4]
        
        // Extract date if available
        const dateMatch = text.match(/(\w+\s+\d{1,2},?\s+\d{4})/)
        const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
        
        reports.push({
          symbol,
          date,
          title: text,
          url: href.startsWith('http') ? href : `${config.irUrl}${href}`,
          quarter: `Q${quarter}`,
          year
        })
      }
    }
  })
  
  // Sort by date descending and limit to 8 most recent
  return reports
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
}

async function scrapeCompanyEarningsEnhanced(
  symbol: string, 
  name: string
): Promise<{
  nextEarning: EarningsDate | null,
  historicalReports: EarningsReport[]
}> {
  const config = COMPANY_SCRAPING_CONFIG[symbol as keyof typeof COMPANY_SCRAPING_CONFIG]
  
  if (!config) {
    logger.warn(`No scraping configuration for ${symbol}`)
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
    const html = await scrapeWithPuppeteer(config.irUrl)
    
    if (!html) {
      throw new Error(`Failed to scrape ${symbol}`)
    }
    
    const nextEarning: EarningsDate = {
      symbol,
      name,
      date: parseEarningsDate(html, config),
      isConfirmed: false,
      source: config.irUrl
    }
    
    const historicalReports = parseHistoricalReports(html, symbol, config)
    
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

export async function scrapeEarningsDataEnhanced(
  symbols: string[], 
  names: string[]
): Promise<{
  nextEarnings: EarningsDate[],
  historicalReports: Record<string, EarningsReport[]>
}> {
  const nextEarnings: EarningsDate[] = []
  const historicalReports: Record<string, EarningsReport[]> = {}
  
  try {
    // Process companies in batches to avoid overwhelming the system
    const batchSize = 3
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      const batchNames = names.slice(i, i + batchSize)
      
      const promises = batch.map((symbol, index) => 
        scrapeCompanyEarningsEnhanced(symbol, batchNames[index])
      )
      
      const results = await Promise.all(promises)
      
      results.forEach((result, index) => {
        if (result.nextEarning) {
          nextEarnings.push(result.nextEarning)
        }
        
        if (result.historicalReports.length > 0) {
          historicalReports[batch[index]] = result.historicalReports
        }
      })
      
      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Sort next earnings by date
    nextEarnings.sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    
    return { nextEarnings, historicalReports }
  } finally {
    // Clean up browser
    await closeBrowser()
  }
}