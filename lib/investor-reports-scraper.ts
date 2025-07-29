import * as cheerio from 'cheerio'
import { getInvestorRelationsUrl } from './investor-relations-urls'

interface Report {
  title: string
  date: string
  url: string
  type: 'quarterly' | 'annual'
}

interface ScrapedReports {
  quarterly: Report[]
  annual: Report[]
}

// Common selectors for finding reports on IR pages
const REPORT_SELECTORS = {
  links: 'a[href*=".pdf"], a[href*="earnings"], a[href*="report"], a[href*="financial"]',
  containers: '.earnings-releases, .financial-reports, .investor-documents, .ir-library, [class*="report"], [class*="earning"]'
}

// Patterns to identify report types
const REPORT_PATTERNS = {
  quarterly: [
    /Q[1-4]\s*20\d{2}/i,
    /\d{1,2}Q\d{2}/i,
    /quarterly.*report/i,
    /earnings.*release/i,
    /quarter.*ended/i,
    /interim.*report/i,
  ],
  annual: [
    /annual.*report.*20\d{2}/i,
    /20\d{2}.*annual.*report/i,
    /form.*10-?k/i,
    /yearly.*report/i,
    /full.*year.*20\d{2}/i,
    /FY\s*20\d{2}/i,
  ],
  halfYearly: [
    /half.*year/i,
    /H[12]\s*20\d{2}/i,
    /interim.*report/i,
    /six.*month/i,
  ]
}

// Extract date from text
function extractDate(text: string): string | null {
  // Try various date patterns
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,  // YYYY/MM/DD
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i,
    /(Q[1-4])\s+(\d{4})/i,  // Q1 2024
    /(\d{4})\s+(Q[1-4])/i,  // 2024 Q1
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Convert to ISO date format
      try {
        const dateStr = match[0]
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      } catch (e) {
        // Try to parse quarter dates
        if (match[1] && match[1].startsWith('Q')) {
          const quarter = parseInt(match[1].substring(1))
          const year = parseInt(match[2])
          const month = (quarter - 1) * 3 + 1
          return `${year}-${month.toString().padStart(2, '0')}-01`
        }
      }
    }
  }
  
  // Extract just year if nothing else works
  const yearMatch = text.match(/20\d{2}/)
  if (yearMatch) {
    return `${yearMatch[0]}-01-01`
  }
  
  return null
}

// Determine report type from text
function getReportType(text: string, isMainfreight: boolean = false): 'quarterly' | 'annual' | null {
  const lowerText = text.toLowerCase()
  
  // For Mainfreight, half-yearly reports are considered annual
  if (isMainfreight) {
    for (const pattern of REPORT_PATTERNS.halfYearly) {
      if (pattern.test(lowerText)) {
        return 'annual'
      }
    }
  }
  
  for (const pattern of REPORT_PATTERNS.quarterly) {
    if (pattern.test(lowerText)) {
      return 'quarterly'
    }
  }
  
  for (const pattern of REPORT_PATTERNS.annual) {
    if (pattern.test(lowerText)) {
      return 'annual'
    }
  }
  
  return null
}

// Clean and resolve URL
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url
  }
  
  try {
    const base = new URL(baseUrl)
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`
    } else {
      const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)
      return `${base.protocol}//${base.host}${basePath}${url}`
    }
  } catch (e) {
    return url
  }
}

export async function scrapeInvestorReports(symbol: string): Promise<ScrapedReports> {
  const reports: ScrapedReports = {
    quarterly: [],
    annual: []
  }
  
  try {
    const irUrl = getInvestorRelationsUrl(symbol)
    if (!irUrl || irUrl.includes('yahoo.com')) {
      // Can't scrape Yahoo Finance, return empty
      return reports
    }
    
    // Fetch the IR page
    const response = await fetch(irUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch IR page for ${symbol}: ${response.status}`)
      return reports
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const isMainfreight = symbol === 'MFT' || symbol === 'MFT.NZ'
    const foundReports = new Map<string, Report>()
    
    // Find all potential report links
    $(REPORT_SELECTORS.links).each((_, element) => {
      const $link = $(element)
      const href = $link.attr('href')
      const text = $link.text().trim()
      const parentText = $link.parent().text().trim()
      const contextText = `${text} ${parentText}`
      
      if (!href || !href.includes('.pdf')) {
        return
      }
      
      const reportType = getReportType(contextText, isMainfreight)
      if (!reportType) {
        return
      }
      
      const date = extractDate(contextText)
      if (!date) {
        return
      }
      
      const url = resolveUrl(href, irUrl)
      const report: Report = {
        title: text || 'Financial Report',
        date,
        url,
        type: reportType
      }
      
      // Use URL as key to avoid duplicates
      foundReports.set(url, report)
    })
    
    // Also check for reports in common container elements
    $(REPORT_SELECTORS.containers).each((_, container) => {
      $(container).find('a[href*=".pdf"]').each((_, element) => {
        const $link = $(element)
        const href = $link.attr('href')
        const text = $link.text().trim()
        const containerText = $(container).text()
        
        if (!href) return
        
        const reportType = getReportType(`${text} ${containerText}`, isMainfreight)
        if (!reportType) return
        
        const date = extractDate(`${text} ${containerText}`)
        if (!date) return
        
        const url = resolveUrl(href, irUrl)
        const report: Report = {
          title: text || 'Financial Report',
          date,
          url,
          type: reportType
        }
        
        foundReports.set(url, report)
      })
    })
    
    // Sort reports by date and type
    const allReports = Array.from(foundReports.values())
    
    reports.quarterly = allReports
      .filter(r => r.type === 'quarterly')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
    
    reports.annual = allReports
      .filter(r => r.type === 'annual')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
  } catch (error) {
    console.error(`Error scraping reports for ${symbol}:`, error)
  }
  
  return reports
}

// Cache scraped results to avoid repeated requests
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const cache = new Map<string, { reports: ScrapedReports, timestamp: number }>()

export async function getCachedInvestorReports(symbol: string): Promise<ScrapedReports> {
  const cached = cache.get(symbol)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.reports
  }
  
  const reports = await scrapeInvestorReports(symbol)
  cache.set(symbol, { reports, timestamp: Date.now() })
  
  return reports
}