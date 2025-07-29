// Known patterns for generating report URLs for specific companies
// These patterns can be used when scraping fails

interface ReportPattern {
  quarterlyPattern?: string
  annualPattern?: string
  baseUrl: string
  dateFormat?: 'Q' | 'FY' | 'MONTH'
}

export const companyReportPatterns: Record<string, ReportPattern> = {
  'AAPL': {
    quarterlyPattern: 'https://www.apple.com/newsroom/pdfs/fy{YEAR}-q{QUARTER}-earnings-release.pdf',
    annualPattern: 'https://s2.q4cdn.com/470004039/files/doc_financials/{YEAR}/ar/_10-K-{YEAR}-(As-Filed).pdf',
    baseUrl: 'https://investor.apple.com/',
    dateFormat: 'Q'
  },
  'MSFT': {
    quarterlyPattern: 'https://www.microsoft.com/investor/earnings/fy-{YEAR}-q{QUARTER}/',
    annualPattern: 'https://www.microsoft.com/investor/reports/ar{SHORTYEAR}/index.html',
    baseUrl: 'https://www.microsoft.com/investor/',
    dateFormat: 'FY'
  },
  'GOOGL': {
    quarterlyPattern: 'https://abc.xyz/investor/static/pdf/{YEAR}Q{QUARTER}_alphabet_earnings_release.pdf',
    annualPattern: 'https://abc.xyz/investor/static/pdf/{YEAR}{MONTH}{DAY}_alphabet_10K.pdf',
    baseUrl: 'https://abc.xyz/investor/',
    dateFormat: 'Q'
  },
  'GOOG': {
    quarterlyPattern: 'https://abc.xyz/investor/static/pdf/{YEAR}Q{QUARTER}_alphabet_earnings_release.pdf',
    annualPattern: 'https://abc.xyz/investor/static/pdf/{YEAR}{MONTH}{DAY}_alphabet_10K.pdf',
    baseUrl: 'https://abc.xyz/investor/',
    dateFormat: 'Q'
  },
  'UBER': {
    quarterlyPattern: 'https://s23.q4cdn.com/407969754/files/doc_financials/{YEAR}/q{QUARTER}/Uber-Q{QUARTER}-{YEAR}-Earnings-Report.pdf',
    annualPattern: 'https://s23.q4cdn.com/407969754/files/doc_financials/{YEAR}/ar/{YEAR}-Annual-Report.pdf',
    baseUrl: 'https://investor.uber.com/',
    dateFormat: 'Q'
  },
  'AMZN': {
    quarterlyPattern: 'https://s2.q4cdn.com/299287126/files/doc_financials/{YEAR}/q{QUARTER}/Amazon-Q{QUARTER}-{YEAR}-Earnings-Release.pdf',
    annualPattern: 'https://s2.q4cdn.com/299287126/files/doc_financials/{YEAR}/ar/Amazon-{YEAR}-Annual-Report.pdf',
    baseUrl: 'https://ir.aboutamazon.com/',
    dateFormat: 'Q'
  },
  'TSLA': {
    quarterlyPattern: 'https://tesla-cdn.thron.com/static/{YEAR}-Q{QUARTER}-Quarterly-Update.pdf',
    annualPattern: 'https://www.tesla.com/ns_videos/tsla-10k-{YEAR}.pdf',
    baseUrl: 'https://ir.tesla.com/',
    dateFormat: 'Q'
  },
  'SPGI': {
    quarterlyPattern: 'https://investor.spglobal.com/Cache/IRCache/file/{FILEID}-PDF.pdf',
    annualPattern: 'https://investor.spglobal.com/Cache/IRCache/file/{FILEID}-PDF.pdf',
    baseUrl: 'https://investor.spglobal.com/',
    dateFormat: 'Q'
  },
  'META': {
    quarterlyPattern: 'https://s21.q4cdn.com/399680738/files/doc_financials/{YEAR}/q{QUARTER}/FB-Q{QUARTER}-{YEAR}-Earnings-Release.pdf',
    annualPattern: 'https://s21.q4cdn.com/399680738/files/doc_financials/{YEAR}/ar/FB-{YEAR}-Annual-Report.pdf',
    baseUrl: 'https://investor.fb.com/',
    dateFormat: 'Q'
  },
  'NVDA': {
    quarterlyPattern: 'https://s22.q4cdn.com/364334381/files/doc_financials/{YEAR}/q{QUARTER}/NVDA-F{QUARTER}Q{SHORTYEAR}-Quarterly-Results.pdf',
    annualPattern: 'https://s22.q4cdn.com/364334381/files/doc_financials/{YEAR}/ar/NVDA-{YEAR}-Annual-Report.pdf',
    baseUrl: 'https://investor.nvidia.com/',
    dateFormat: 'FY'
  }
}

export function generateReportUrls(symbol: string, year: number, quarter?: number): { quarterly?: string, annual?: string } {
  const pattern = companyReportPatterns[symbol] || companyReportPatterns[symbol.split('.')[0]]
  if (!pattern) return {}
  
  const result: { quarterly?: string, annual?: string } = {}
  
  // Generate quarterly URL
  if (pattern.quarterlyPattern && quarter) {
    result.quarterly = pattern.quarterlyPattern
      .replace(/\{YEAR\}/g, year.toString())
      .replace(/\{QUARTER\}/g, quarter.toString())
      .replace(/\{SHORTYEAR\}/g, year.toString().slice(-2))
  }
  
  // Generate annual URL
  if (pattern.annualPattern) {
    result.annual = pattern.annualPattern
      .replace(/\{YEAR\}/g, year.toString())
      .replace(/\{SHORTYEAR\}/g, year.toString().slice(-2))
      .replace(/\{MONTH\}/g, '02') // Most annual reports are filed in February
      .replace(/\{DAY\}/g, '15')
  }
  
  return result
}

export function generateRecentReports(symbol: string) {
  const reports = {
    quarterly: [] as any[],
    annual: [] as any[]
  }
  
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  
  // Generate last 8 quarterly reports
  for (let i = 0; i < 8; i++) {
    let year = currentYear
    let quarter = currentQuarter - i
    
    while (quarter <= 0) {
      quarter += 4
      year--
    }
    
    const urls = generateReportUrls(symbol, year, quarter)
    if (urls.quarterly) {
      reports.quarterly.push({
        title: `Q${quarter} ${year} Earnings Release`,
        date: `${year}-${(quarter * 3 - 2).toString().padStart(2, '0')}-01`,
        url: urls.quarterly,
        type: 'quarterly'
      })
    }
  }
  
  // Generate last 3 annual reports
  for (let i = 0; i < 3; i++) {
    const year = currentYear - i - 1 // Previous years
    const urls = generateReportUrls(symbol, year)
    if (urls.annual) {
      reports.annual.push({
        title: `${year} Annual Report`,
        date: `${year + 1}-02-15`, // Usually filed in February of next year
        url: urls.annual,
        type: 'annual'
      })
    }
  }
  
  return reports
}