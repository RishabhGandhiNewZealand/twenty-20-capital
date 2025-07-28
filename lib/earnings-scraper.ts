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
  customScraper?: (symbol: string, year: string, quarter?: string) => Promise<EarningsURL[]>
}

// Comprehensive configurations for all portfolio companies
const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  'MA': {
    name: 'Mastercard Inc.',
    baseUrl: 'https://investor.mastercard.com',
    investorUrl: 'https://investor.mastercard.com/investor-news/investor-news-details',
    earningsPattern: [/earnings.*release/i, /quarterly.*results/i, /Q[1-4].*\d{4}.*earnings/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterNum = q.slice(1)
        const yearShort = year.slice(-2)
        
        // Correct Mastercard pattern: {Q}Q{YY}-Mastercard-Earnings-Release.pdf
        const url = `https://s25.q4cdn.com/479285134/files/doc_financials/${year}/${q.toLowerCase()}/${quarterNum}Q${yearShort}-Mastercard-Earnings-Release.pdf`
        
        const isValid = await validateURL(url)
        results.push({
          url,
          title: `Mastercard ${q} ${year} Earnings Release`,
          quarter: q,
          year,
          date: getQuarterEndDate(q, year),
          isValid
        })
      }
      return results
    }
  },
  
  'GOOGL': {
    name: 'Alphabet Inc.',
    baseUrl: 'https://abc.xyz',
    investorUrl: 'https://abc.xyz/investor',
    earningsPattern: [/earnings.*release/i, /alphabet.*earnings/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      // Google uses random hash patterns - we need to implement a search approach
      for (const q of quarters) {
        const predictedUrls = [
          `https://abc.xyz/assets/earnings/${year}${q.toLowerCase()}-alphabet-earnings-release.pdf`,
          `https://abc.xyz/assets/investor/${year}/${q.toLowerCase()}/alphabet-earnings-release.pdf`
        ]
        
        for (const url of predictedUrls) {
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
    baseUrl: 'https://microsoft.gcs-web.com',
    investorUrl: 'https://www.microsoft.com/en-us/investor',
    earningsPattern: [/earnings.*release/i, /microsoft.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        // Microsoft uses GCS static files with UUID-like identifiers
        // Since these change, we'll provide a general pattern that needs updating
        const predictedUrls = [
          `https://microsoft.gcs-web.com/static-files/msft-${year}-${q.toLowerCase()}-earnings.pdf`,
          `https://www.microsoft.com/en-us/investor/earnings/fy-${year.slice(-2)}-${q.toLowerCase()}/press-release.pdf`
        ]
        
        for (const url of predictedUrls) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Microsoft ${q} FY${year.slice(-2)} Earnings Release`,
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
    baseUrl: 'https://s21.q4cdn.com/399680738',
    investorUrl: 'https://investor.fb.com',
    earningsPattern: [/earnings.*release/i, /meta.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const quarterEndDate = getQuarterEndDate(q, year)
        
        // Meta pattern: Meta-MM-DD-YYYY-Exhibit-99-1_FINAL.pdf
        const patterns = [
          `https://s21.q4cdn.com/399680738/files/doc_financials/${year}/${q.toLowerCase()}/Meta-${quarterEndDate}-Exhibit-99-1_FINAL.pdf`,
          `https://s21.q4cdn.com/399680738/files/doc_financials/${year}/${q.toLowerCase()}/Meta-${q}-${year}-Earnings-Release.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Meta ${q} ${year} Earnings Release`,
              quarter: q,
              year,
              date: quarterEndDate,
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
    baseUrl: 'https://s2.q4cdn.com/299287126',
    investorUrl: 'https://ir.aboutamazon.com',
    earningsPattern: [/earnings.*release/i, /amazon.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        // Amazon pattern: Amazon-Q#-YYYY-Earnings-Release.pdf
        const patterns = [
          `https://s2.q4cdn.com/299287126/files/doc_financials/${year}/${q.toLowerCase()}/Amazon-${q}-${year}-Earnings-Release.pdf`,
          `https://ir.aboutamazon.com/files/doc_financials/${year}/${q.toLowerCase()}/Amazon-${q}-${year}-Earnings-Release.pdf`
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
    baseUrl: 'https://s22.q4cdn.com/364334381',
    investorUrl: 'https://investor.nvidia.com',
    earningsPattern: [/earnings.*release/i, /nvidia.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        // NVIDIA uses FY notation (fiscal year ending in January)
        const fyYear = (parseInt(year) + 1).toString().slice(-2)
        
        const patterns = [
          `https://s22.q4cdn.com/364334381/files/doc_news/${year}/${getQuarterMonth(q)}/NVIDIA-${q}-FY${fyYear}-Earnings-Release.pdf`,
          `https://s22.q4cdn.com/364334381/files/doc_news/${year}/${getQuarterMonth(q)}/nvidia-${q}-fy${fyYear}-earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `NVIDIA ${q} FY${fyYear} Earnings Release`,
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
    baseUrl: 'https://s22.q4cdn.com/959853165',
    investorUrl: 'https://ir.netflix.net',
    earningsPattern: [/earnings.*release/i, /netflix.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s22.q4cdn.com/959853165/files/doc_financials/${year}/${q.toLowerCase()}/NFLX-${q}${year.slice(-2)}-Earnings-Release.pdf`,
          `https://ir.netflix.net/files/doc_financials/${year}/${q.toLowerCase()}/Netflix-${q}-${year}-Earnings.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `Netflix ${q} ${year} Earnings Release`,
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
    baseUrl: 'https://s23.q4cdn.com/407969754',
    investorUrl: 'https://investor.uber.com',
    earningsPattern: [/earnings.*release/i, /uber.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://s23.q4cdn.com/407969754/files/doc_financials/${year}/${q.toLowerCase()}/Uber-${q}${year.slice(-2)}-Earnings-Release.pdf`,
          `https://investor.uber.com/static-files/uber-${q}-${year}-earnings.pdf`
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

  'ASML': {
    name: 'ASML Holding N.V.',
    baseUrl: 'https://www.asml.com',
    investorUrl: 'https://www.asml.com/en/investors',
    earningsPattern: [/earnings.*release/i, /quarterly.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://www.asml.com/files/investors/quarterly-results/${year}/${q.toLowerCase()}/asml-${q}-${year}-results.pdf`,
          `https://www.asml.com/files/asml-quarterly-results-${q}-${year}.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `ASML ${q} ${year} Quarterly Results`,
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
    investorUrl: 'https://investor.spglobal.com',
    earningsPattern: [/earnings.*release/i, /quarterly.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://investor.spglobal.com/static-files/spgi-${q}-${year}-earnings.pdf`,
          `https://investor.spglobal.com/files/doc_financials/${year}/${q.toLowerCase()}/SPGI-${q}${year.slice(-2)}-Earnings-Release.pdf`
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
    investorUrl: 'https://investor.tsmc.com',
    earningsPattern: [/earnings.*release/i, /quarterly.*results/i],
    customScraper: async (symbol: string, year: string, quarter?: string) => {
      const results: EarningsURL[] = []
      const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4']
      
      for (const q of quarters) {
        const patterns = [
          `https://investor.tsmc.com/static-files/tsmc-${q}-${year}-earnings.pdf`,
          `https://investor.tsmc.com/files/quarterly-results/${year}/${q.toLowerCase()}/tsmc-results-${q}${year.slice(-2)}.pdf`
        ]
        
        for (const url of patterns) {
          const isValid = await validateURL(url)
          if (isValid) {
            results.push({
              url,
              title: `TSM ${q} ${year} Quarterly Results`,
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
    earningsPattern: [/interim.*results/i, /annual.*results/i, /half.*year/i],
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
              quarter: period === 'Interim' ? 'H1' : 'FY',
              year,
              date: period === 'Interim' ? `${year}-08-31` : `${year}-03-31`,
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

async function validateURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

function getQuarterEndDate(quarter: string, year: string): string {
  const quarterDates = {
    'Q1': `${year}-03-31`,
    'Q2': `${year}-06-30`,
    'Q3': `${year}-09-30`,
    'Q4': `${year}-12-31`,
    'H1': `${year}-06-30`,
    'FY': `${year}-12-31`
  }
  return quarterDates[quarter as keyof typeof quarterDates] || `${year}-12-31`
}

function getQuarterMonth(quarter: string): string {
  const months = {
    'Q1': '03',
    'Q2': '06', 
    'Q3': '09',
    'Q4': '12'
  }
  return months[quarter as keyof typeof months] || '12'
}

export async function scrapeEarningsReleases(symbol: string, year: string, quarter?: string): Promise<EarningsURL[]> {
  const config = COMPANY_CONFIGS[symbol.toUpperCase()]
  if (!config?.customScraper) {
    return []
  }

  try {
    return await config.customScraper(symbol, year, quarter)
  } catch (error) {
    console.error(`Error scraping ${symbol}:`, error)
    return []
  }
}

export function getSupportedSymbols(): string[] {
  return Object.keys(COMPANY_CONFIGS)
}

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