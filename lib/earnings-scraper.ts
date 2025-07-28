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

// Real earnings announcement dates for portfolio companies
const REAL_EARNINGS_DATES: Record<string, Record<string, Record<string, string>>> = {
  'MA': {
    '2024': {
      'Q4': '2025-01-30',
      'Q3': '2024-10-31',
      'Q2': '2024-07-31',
      'Q1': '2024-05-01'
    },
    '2023': {
      'Q4': '2024-01-31',
      'Q3': '2023-10-26',
      'Q2': '2023-07-27',
      'Q1': '2023-04-27'
    }
  },
  'MSFT': {
    '2024': {
      'Q4': '2024-07-24',
      'Q3': '2024-04-24',
      'Q2': '2024-01-24',
      'Q1': '2023-10-24'
    },
    '2023': {
      'Q4': '2023-07-25',
      'Q3': '2023-04-25',
      'Q2': '2023-01-24',
      'Q1': '2022-10-25'
    }
  },
  'NVDA': {
    '2024': {
      'Q4': '2024-02-21',
      'Q3': '2023-11-21',
      'Q2': '2023-08-23',
      'Q1': '2023-05-24'
    },
    '2023': {
      'Q4': '2023-02-22',
      'Q3': '2022-11-16',
      'Q2': '2022-08-24',
      'Q1': '2022-05-25'
    }
  },
  'META': {
    '2024': {
      'Q4': '2025-01-29',
      'Q3': '2024-10-30',
      'Q2': '2024-07-31',
      'Q1': '2024-04-24'
    },
    '2023': {
      'Q4': '2024-02-01',
      'Q3': '2023-10-25',
      'Q2': '2023-07-26',
      'Q1': '2023-04-26'
    }
  },
  'AMZN': {
    '2024': {
      'Q4': '2025-01-30',
      'Q3': '2024-10-31',
      'Q2': '2024-08-01',
      'Q1': '2024-04-30'
    },
    '2023': {
      'Q4': '2024-02-01',
      'Q3': '2023-10-26',
      'Q2': '2023-07-27',
      'Q1': '2023-04-27'
    }
  },
  'GOOGL': {
    '2024': {
      'Q4': '2025-02-04',
      'Q3': '2024-10-29',
      'Q2': '2024-07-23',
      'Q1': '2024-04-25'
    },
    '2023': {
      'Q4': '2024-01-30',
      'Q3': '2023-10-24',
      'Q2': '2023-07-25',
      'Q1': '2023-04-25'
    }
  }
}

// Portfolio company configurations with verified patterns
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
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1) // Get number from Q1, Q2, etc.
        const yearShort = year.slice(-2) // Get last 2 digits of year
        
        // Verified pattern: {Q}Q{YY}-Mastercard-Earnings-Release.pdf
        const url = `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/q${quarterNum}/${quarterNum}Q${yearShort}-Mastercard-Earnings-Release.pdf`
        
        const isValid = await validateURL(url)
        const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
        
        results.push({
          url,
          title: `Mastercard ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'MSFT': {
    name: 'Microsoft Corporation',
    baseUrl: 'https://www.microsoft.com',
    investorUrl: 'https://www.microsoft.com/en-us/Investor',
    earningsPattern: [
      /financial.*results/i,
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const yearShort = year.slice(-2)
        
        // Microsoft uses fiscal year quarters
        const url = `https://view.officeapps.live.com/op/view.aspx?src=https://c.s-microsoft.com/en-us/CMSFiles/FinancialResultsFY${yearShort}Q${quarterNum}.docx`
        
        const isValid = await validateURL(url)
        const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
        
        results.push({
          url,
          title: `Microsoft FY${yearShort} Q${quarterNum} Financial Results`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'NVDA': {
    name: 'NVIDIA Corporation',
    baseUrl: 'https://nvidianews.nvidia.com',
    investorUrl: 'https://nvidianews.nvidia.com/news',
    earningsPattern: [
      /financial.*results/i,
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNames = ['first', 'second', 'third', 'fourth']
        const quarterName = quarterNames[parseInt(q.slice(1)) - 1]
        
        // NVIDIA uses news page URLs (HTML)
        const url = `https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-${quarterName}-quarter-fiscal-${year}`
        
        const isValid = await validateURL(url)
        const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
        
        results.push({
          url,
          title: `NVIDIA ${q} FY${year} Financial Results`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'META': {
    name: 'Meta Platforms Inc.',
    baseUrl: 'https://investor.fb.com',
    investorUrl: 'https://investor.fb.com/investor-news/default.aspx',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const quarterEndDates = {
          'Q1': '03-31',
          'Q2': '06-30', 
          'Q3': '09-30',
          'Q4': '12-31'
        }
        const endDate = quarterEndDates[q as keyof typeof quarterEndDates]
        
        // Verified Meta pattern: Meta-{MM-DD-YYYY}-Exhibit-99-1_FINAL.pdf
        const url = `https://s21.q4cdn.com/399680738/files/doc_financials/${year}/q${quarterNum}/Meta-${endDate}-${year}-Exhibit-99-1_FINAL.pdf`
        
        const isValid = await validateURL(url)
        const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
        
        results.push({
          url,
          title: `Meta ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    baseUrl: 'https://ir.aboutamazon.com',
    investorUrl: 'https://ir.aboutamazon.com/news-release/news-release-details',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        
        // Amazon pattern - try multiple known patterns
        const patterns = [
          `https://s2.q4cdn.com/299287126/files/doc_financials/${year}/q${quarterNum}/Amazon-Q${quarterNum}-${year}-Earnings-Release.pdf`,
          `https://ir.aboutamazon.com/files/doc_financials/${year}/q${quarterNum}/Amazon-Q${quarterNum}-${year}-Earnings-Release.pdf`
        ]
        
        let foundValid = false
        for (const url of patterns) {
          const isValid = await validateURL(url)
          const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
          
          if (isValid) {
            results.push({
              url,
              title: `Amazon ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: realDate,
              isValid: true
            })
            foundValid = true
            break
          }
        }
        
        if (!foundValid) {
          const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
          results.push({
            url: patterns[0], // Use first pattern as fallback
            title: `Amazon ${q} ${year} Earnings Release`,
            quarter: q,
            year,
            date: realDate,
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
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        
        // Try different Alphabet/Google patterns
        const patterns = [
          `https://abc.xyz/investor/static/pdf/${year}Q${quarterNum}_alphabet_earnings_release.pdf`,
          `https://www.gstatic.com/hostedimg/${year}Q${quarterNum}_alphabet_earnings_release.pdf`,
          `https://s21.q4cdn.com/399680738/files/doc_financials/${year}/q${quarterNum}/${year}Q${quarterNum}_alphabet_earnings_release.pdf`
        ]
        
        let foundValid = false
        for (const url of patterns) {
          const isValid = await validateURL(url)
          const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
          
          if (isValid) {
            results.push({
              url,
              title: `Alphabet ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: realDate,
              isValid: true
            })
            foundValid = true
            break
          }
        }
        
        if (!foundValid) {
          const realDate = REAL_EARNINGS_DATES[symbol]?.[year]?.[q] || getQuarterEndDate(q, year)
          results.push({
            url: patterns[0], // Use first pattern as fallback
            title: `Alphabet ${q} ${year} Earnings Release`,
            quarter: q,
            year,
            date: realDate,
            isValid: false
          })
        }
      }
      return results
    }
  },
  'NFLX': {
    name: 'Netflix Inc.',
    baseUrl: 'https://ir.netflix.net',
    investorUrl: 'https://ir.netflix.net/financials/quarterly-earnings/default.aspx',
    earningsPattern: [
      /shareholder.*letter/i,
      /earnings.*release/i,
      /quarterly.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const yearShort = year.slice(-2)
        
        // Netflix uses shareholder letters
        const url = `https://s22.q4cdn.com/959853165/files/doc_financials/${year}/q${quarterNum}/FINAL-Q${quarterNum}-${yearShort}-Shareholder-Letter.pdf`
        
        const isValid = await validateURL(url)
        const realDate = getQuarterEndDate(q, year) // Netflix doesn't have real dates yet
        
        results.push({
          url,
          title: `Netflix ${q} ${year} Shareholder Letter`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'UBER': {
    name: 'Uber Technologies Inc.',
    baseUrl: 'https://investor.uber.com',
    investorUrl: 'https://investor.uber.com/news-events/news/default.aspx',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const months = ['02', '05', '08', '11'] // Approximate months for Q1-Q4
        const month = months[parseInt(quarterNum) - 1]
        
        const url = `https://s23.q4cdn.com/407969754/files/doc_news/${year}/${month}/Uber-Q${quarterNum}-${year}-Earnings-Release.pdf`
        
        const isValid = await validateURL(url)
        const realDate = getQuarterEndDate(q, year) // Uber doesn't have real dates yet
        
        results.push({
          url,
          title: `Uber ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'ASML': {
    name: 'ASML Holding N.V.',
    baseUrl: 'https://www.asml.com',
    investorUrl: 'https://www.asml.com/en/investors/financial-results',
    earningsPattern: [
      /earnings.*press.*release/i,
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        
        const url = `https://www.asml.com/-/media/asml/files/investors/financial-results/${year}/q${quarterNum}-${year}-earnings-press-release.pdf`
        
        const isValid = await validateURL(url)
        const realDate = getQuarterEndDate(q, year) // ASML doesn't have real dates yet
        
        results.push({
          url,
          title: `ASML ${q} ${year} Earnings Press Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
      }
      return results
    }
  },
  'SPGI': {
    name: 'S&P Global Inc.',
    baseUrl: 'https://investor.spglobal.com',
    investorUrl: 'https://investor.spglobal.com/news-and-events/news-releases',
    earningsPattern: [
      /earnings.*release/i,
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const months = ['02', '05', '08', '11'] // Approximate months for Q1-Q4
        const month = months[parseInt(quarterNum) - 1]
        
        const url = `https://s24.q4cdn.com/310240600/files/doc_news/${year}/${month}/SPGI-Q${quarterNum}-${year}-Earnings-Release.pdf`
        
        const isValid = await validateURL(url)
        const realDate = getQuarterEndDate(q, year) // SPGI doesn't have real dates yet
        
        results.push({
          url,
          title: `S&P Global ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
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
      /quarterly.*results/i,
      /financial.*results/i
    ],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNames = ['1st', '2nd', '3rd', '4th']
        const quarterName = quarterNames[parseInt(q.slice(1)) - 1]
        const months = ['04', '07', '10', '01'] // Approximate months for Q1-Q4
        const month = months[parseInt(q.slice(1)) - 1]
        
        const url = `https://investor.tsmc.com/sites/default/files/${year}-${month}/${year}${quarterName}_earningsrelease_e.pdf`
        
        const isValid = await validateURL(url)
        const realDate = getQuarterEndDate(q, year) // TSM doesn't have real dates yet
        
        results.push({
          url,
          title: `Taiwan Semiconductor ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: realDate,
          isValid
        })
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
              quarter: period === 'Interim' ? 'Q2' : 'Q4', 
              year,
              date: period === 'Interim' ? `${year}-09-30` : `${year}-03-31`, 
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

// Helper function to validate if a URL exists and returns 200
async function validateURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.status === 200
  } catch (error) {
    return false
  }
}

// Helper function to get quarter end date
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
export async function scrapeEarningsReleases(symbol: string, year: string, quarter?: string): Promise<EarningsURL[]> {
  const config = COMPANY_CONFIGS[symbol.toUpperCase()]
  if (!config || !config.customScraper) {
    throw new Error(`No configuration found for symbol: ${symbol}`)
  }
  
  return config.customScraper(symbol, year, quarter)
}

// Function to get list of supported symbols
export function getSupportedSymbols(): string[] {
  return Object.keys(COMPANY_CONFIGS)
}

// Function to test URLs for all companies
export async function testCompanyURLs(symbol: string): Promise<{
  symbol: string
  validUrls: number
  totalUrls: number
  results: EarningsURL[]
}> {
  const results = await scrapeEarningsReleases(symbol, '2024')
  const validUrls = results.filter(r => r.isValid).length
  
  return {
    symbol,
    validUrls,
    totalUrls: results.length,
    results
  }
}