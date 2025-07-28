const fs = require('fs').promises
const path = require('path')

// Demo portfolio holdings
const DEMO_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'ASML', name: 'ASML Holding N.V.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' }
]

// Company IR URLs
const COMPANY_IR_URLS = {
  'AAPL': 'https://investor.apple.com/investor-relations/default.aspx',
  'MSFT': 'https://www.microsoft.com/en-us/investor',
  'GOOGL': 'https://abc.xyz/investor/',
  'AMZN': 'https://ir.aboutamazon.com/quarterly-results/default.aspx',
  'NVDA': 'https://investor.nvidia.com/financial-info/quarterly-results/default.aspx',
  'META': 'https://investor.fb.com/investor-events/default.aspx',
  'TSLA': 'https://ir.tesla.com/',
  'BRK.B': 'https://www.berkshirehathaway.com/reports.html',
  'V': 'https://investor.visa.com/financial-information/quarterly-earnings/default.aspx',
  'MA': 'https://investor.mastercard.com/investor-relations/financials/quarterly-results/default.aspx',
  'ASML': 'https://www.asml.com/en/investors/financial-results',
  'UBER': 'https://investor.uber.com/financials/default.aspx'
}

function generateHistoricalReports(symbol, name) {
  const reports = []
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)
  
  // Generate reports for the last 5 years
  for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
    const year = currentYear - yearOffset
    
    for (let q = 4; q >= 1; q--) {
      // Skip future quarters
      if (year === currentYear && q > currentQuarter) continue
      
      const reportMonth = q * 3
      const reportDate = new Date(year, reportMonth - 1, 1)
      
      // Skip if report date is in the future
      if (reportDate > new Date()) continue
      
      reports.push({
        symbol,
        date: reportDate.toISOString(),
        title: `${symbol} Q${q} ${year} Earnings Report`,
        url: COMPANY_IR_URLS[symbol] || '#',
        quarter: `Q${q}`,
        year: year.toString(),
        fiscalQuarter: `Q${q} ${year}`,
        reportType: 'Quarterly Earnings'
      })
    }
  }
  
  return reports
}

async function prebuildEarnings() {
  console.log('Prebuild: Generating static earnings data...')
  
  try {
    // Create cache directory if it doesn't exist
    const cacheDir = path.join(process.cwd(), '.cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Generate earnings data
    const nextEarnings = []
    const historicalReports = {}
    
    // Generate data for each holding
    for (const holding of DEMO_HOLDINGS) {
      // Add to next earnings (all showing as not announced for static data)
      nextEarnings.push({
        symbol: holding.symbol,
        name: holding.name,
        date: null,
        isConfirmed: false,
        source: 'Static data'
      })
      
      // Generate historical reports
      historicalReports[holding.symbol] = generateHistoricalReports(holding.symbol, holding.name)
    }
    
    // Create the data object
    const earningsData = {
      nextEarnings,
      historicalReports,
      lastUpdated: new Date().toISOString(),
      cached: true,
      static: true,
      buildTime: new Date().toISOString()
    }
    
    // Write to cache file
    await fs.writeFile(
      path.join(cacheDir, 'earnings-data.json'),
      JSON.stringify(earningsData, null, 2)
    )
    
    console.log('Prebuild: Static earnings data generated successfully')
    console.log(`Prebuild: Generated data for ${DEMO_HOLDINGS.length} companies`)
    console.log(`Prebuild: Total reports: ${Object.values(historicalReports).flat().length}`)
  } catch (error) {
    console.error('Prebuild: Error generating earnings data:', error)
    process.exit(1) // Fail the build on error
  }
}

// Run if called directly
if (require.main === module) {
  prebuildEarnings()
}

module.exports = { prebuildEarnings }