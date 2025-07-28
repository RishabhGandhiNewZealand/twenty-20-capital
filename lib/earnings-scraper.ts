import * as cheerio from 'cheerio'

interface EarningsURL {
  url: string
  title: string
  quarter: string
  year: string
  date: string
  isValid: boolean
}

interface CompanyConfig {
  name: string
  baseUrl: string
  investorUrl: string
  earningsPattern: RegExp[]
  urlSelector?: string
  titleSelector?: string
  dateSelector?: string
  customScraper?: (symbol: string, year: string, quarter?: string) => Promise<EarningsURL[]>
}

// Portfolio company configurations
const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  'MA': {
    name: 'Mastercard Inc.',
    baseUrl: 'https://investor.mastercard.com',
    investorUrl: 'https://investor.mastercard.com/investor-news/investor-news-details',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i,
      /Q[1-4].*\d{4}.*earnings/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      // Mastercard uses specific Q4 CDN pattern: 1Q25, 2Q25, etc.
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1) // Get number from Q1, Q2, etc.
        const yearShort = year.slice(-2) // Get last 2 digits of year
        const patterns = [
          `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/${q.toLowerCase()}/${quarterNum}${q}${yearShort}-Earnings-Release.pdf`,
          `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/${q.toLowerCase()}/${year}${q}-Earnings-Release.pdf`,
          `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/${q.toLowerCase()}/MA-${year}-${q}-Earnings-Release.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Mastercard ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break // Found a working URL, move to next quarter
          }
        }
        
        // If no valid URL found for this quarter, add the best guess
        if (!results.some(r => r.quarter === q && r.isValid)) {
          results.push({
            url: patterns[0], // Use first pattern as best guess
            title: `Mastercard ${q} ${year} Earnings Release`,
            quarter: q,
            year,
            date: getQuarterEndDate(q, year),
            isValid: false
          })
        }
      }
      
      return results
    }
  },
  
  'GOOGL': {
    name: 'Alphabet Inc.',
    baseUrl: 'https://abc.xyz',
    investorUrl: 'https://abc.xyz/investor/',
    earningsPattern: [
      /earnings.*release/i,
      /Q[1-4].*\d{4}.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      // Try multiple URL patterns for Alphabet
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://abc.xyz/investor/static/pdf/${year}_${q}_earnings_release.pdf`,
          `https://abc.xyz/investor/static/pdf/alphabet_${year}_${q}_earnings_release.pdf`,
          `https://abc.xyz/investor/static/pdf/${year}${q}_alphabet_earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Alphabet ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'MSFT': {
    name: 'Microsoft Corporation',
    baseUrl: 'https://www.microsoft.com/en-us/Investor',
    investorUrl: 'https://www.microsoft.com/en-us/Investor/earnings',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*earnings/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        // Microsoft fiscal year Q1 = Jul-Sep, Q2 = Oct-Dec, Q3 = Jan-Mar, Q4 = Apr-Jun
        const fiscalYear = q === 'Q1' || q === 'Q2' ? parseInt(year) + 1 : parseInt(year)
        const patterns = [
          `https://c.s-microsoft.com/en-us/CMSFiles/FY${fiscalYear}${q}_earnings.pdf`,
          `https://c.s-microsoft.com/en-us/CMSFiles/MS_Earnings_FY${fiscalYear}_${q}.pdf`,
          `https://view.officeapps.live.com/op/view.aspx?src=https://c.s-microsoft.com/en-us/CMSFiles/FY${fiscalYear}${q}_earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Microsoft FY${fiscalYear} ${q} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'META': {
    name: 'Meta Platforms Inc.',
    baseUrl: 'https://investor.fb.com',
    investorUrl: 'https://investor.fb.com/investor-news/',
    earningsPattern: [
      /earnings.*release/i,
      /Q[1-4].*\d{4}/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s21.q4cdn.com/399680738/files/doc_financials/${year}/q${q.slice(1)}/Meta-${year}-${q}-Earnings-Release.pdf`,
          `https://s21.q4cdn.com/399680738/files/doc_news/${year}/Meta-Reports-${q}-${year}-Results.pdf`,
          `https://investor.fb.com/investor-news/press-release-details/${year}/Meta-Reports-${q}-${year}-Results/`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Meta ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'AMZN': {
    name: 'Amazon.com Inc.',
    baseUrl: 'https://ir.aboutamazon.com',
    investorUrl: 'https://ir.aboutamazon.com/quarterly-results/',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s2.q4cdn.com/299287126/files/doc_financials/${year}/q${q.slice(1)}/AMZN-${q}-${year}-Earnings-Release.pdf`,
          `https://s2.q4cdn.com/299287126/files/doc_financials/${year}/q${q.slice(1)}/Q${q.slice(1)}-${year}-Amazon-Earnings-Release.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Amazon ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'NVDA': {
    name: 'NVIDIA Corporation',
    baseUrl: 'https://investor.nvidia.com',
    investorUrl: 'https://investor.nvidia.com/financial-info/quarterly-results/',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        // NVIDIA fiscal year ends in January
        const fiscalYear = q === 'Q1' || q === 'Q2' || q === 'Q3' ? parseInt(year) + 1 : parseInt(year)
        const patterns = [
          `https://s22.q4cdn.com/364334381/files/doc_financials/${year}/q${q.slice(1)}/NVDA-${q}-FY${fiscalYear}-Earnings-Release.pdf`,
          `https://s22.q4cdn.com/364334381/files/doc_financials/${year}/q${q.slice(1)}/NVIDIA-Q${q.slice(1)}-FY${fiscalYear}-Earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `NVIDIA ${q} FY${fiscalYear} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'UBER': {
    name: 'Uber Technologies Inc.',
    baseUrl: 'https://investor.uber.com',
    investorUrl: 'https://investor.uber.com/news-events/news/',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s23.q4cdn.com/407969754/files/doc_news/${year}/Uber-${q}-${year}-Earnings-Release.pdf`,
          `https://s23.q4cdn.com/407969754/files/doc_financials/${year}/q${q.slice(1)}/Uber-Reports-${q}-${year}-Results.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Uber ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'NFLX': {
    name: 'Netflix Inc.',
    baseUrl: 'https://ir.netflix.net',
    investorUrl: 'https://ir.netflix.net/quarterly-earnings/',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s22.q4cdn.com/959853165/files/doc_financials/${year}/q${q.slice(1)}/FINAL-Q${q.slice(1)}-${year}-Shareholder-Letter.pdf`,
          `https://s22.q4cdn.com/959853165/files/doc_financials/${year}/q${q.slice(1)}/Netflix-${q}-${year}-Earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Netflix ${q} ${year} Shareholder Letter`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'ASML': {
    name: 'ASML Holding N.V.',
    baseUrl: 'https://www.asml.com/en/investors',
    investorUrl: 'https://www.asml.com/en/investors/financial-results',
    earningsPattern: [
      /quarterly.*results/i,
      /Q[1-4].*\d{4}/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://www.asml.com/-/media/asml/files/investors/financial-results/${year}/asml-${q.toLowerCase()}-${year}-results.pdf`,
          `https://www.asml.com/-/media/asml/files/investors/quarterly-results/${year}/q${q.slice(1)}/asml-quarterly-results-${q.toLowerCase()}-${year}.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `ASML ${q} ${year} Results`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'SPGI': {
    name: 'S&P Global Inc.',
    baseUrl: 'https://investor.spglobal.com',
    investorUrl: 'https://investor.spglobal.com/news-events/press-releases',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s26.q4cdn.com/533222904/files/doc_financials/${year}/q${q.slice(1)}/SPGI-${q}-${year}-Earnings-Release.pdf`,
          `https://s26.q4cdn.com/533222904/files/doc_news/${year}/SP-Global-Reports-${q}-${year}-Results.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `S&P Global ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'TSM': {
    name: 'Taiwan Semiconductor Manufacturing Company',
    baseUrl: 'https://investor.tsmc.com',
    investorUrl: 'https://investor.tsmc.com/english/quarterly-results',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://investor.tsmc.com/sites/default/files/${year}-${q.toLowerCase()}/TSMC-${q}-${year}-Earnings-Release.pdf`,
          `https://investor.tsmc.com/sites/default/files/quarterly-results/${year}/q${q.slice(1)}/tsmc-${year}-${q.toLowerCase()}-results.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `TSMC ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: getQuarterEndDate(q, year),
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  },
  
  'MFT': {
    name: 'Mainfreight Limited',
    baseUrl: 'https://www.mainfreight.com',
    investorUrl: 'https://www.mainfreight.com/investors/reports-and-presentations',
    earningsPattern: [
      /interim.*results/i,
      /annual.*results/i,
      /half.*year/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      // MFT reports semi-annually (interim and annual)
      const periods = quarter ? [quarter] : ['Interim', 'Annual']
      
      for (const period of periods) {
        const patterns = [
          `https://www.mainfreight.com/media/pdf/reports/${year}-${period.toLowerCase()}-results.pdf`,
          `https://www.mainfreight.com/media/pdf/mft-${year}-${period.toLowerCase()}-report.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Mainfreight ${period} ${year} Results`,
              quarter: period === 'Interim' ? 'Q2' : 'Q4', // Map to quarters
              year,
              date: period === 'Interim' ? `${year}-09-30` : `${year}-03-31`, // MFT year ends March
              isValid: true
            })
            break
          }
        }
      }
      
      return results
    }
  }
}

// Validate if a URL returns a successful response
async function validateURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EarningsBot/1.0)'
      }
    })
    return response.ok && response.status === 200
  } catch (error) {
    return false
  }
}

// Get quarter end date
function getQuarterEndDate(quarter: string, year: string): string {
  const quarterDates = {
    'Q1': `${year}-03-31`,
    'Q2': `${year}-06-30`,
    'Q3': `${year}-09-30`,
    'Q4': `${year}-12-31`
  }
  return quarterDates[quarter as keyof typeof quarterDates] || `${year}-12-31`
}

// Main function to scrape earnings releases for a company
export async function scrapeEarningsReleases(
  symbol: string, 
  year: string = new Date().getFullYear().toString(), 
  quarter?: string
): Promise<EarningsURL[]> {
  const config = COMPANY_CONFIGS[symbol.toUpperCase()]
  
  if (!config) {
    throw new Error(`No configuration found for symbol: ${symbol}`)
  }
  
  try {
    if (config.customScraper) {
      return await config.customScraper(symbol, year, quarter)
    }
    
    // Fallback generic scraper (simplified for now)
    return []
    
  } catch (error) {
    console.error(`Error scraping earnings for ${symbol}:`, error)
    return []
  }
}

// Get all supported symbols
export function getSupportedSymbols(): string[] {
  return Object.keys(COMPANY_CONFIGS)
}

// Test all URLs for a company to verify they work
export async function testCompanyURLs(symbol: string, year: string): Promise<{
  symbol: string
  totalUrls: number
  validUrls: number
  results: EarningsURL[]
}> {
  const results = await scrapeEarningsReleases(symbol, year)
  const validResults = results.filter(r => r.isValid)
  
  return {
    symbol,
    totalUrls: results.length,
    validUrls: validResults.length,
    results
  }
}