const { testCompanyURLs } = require('../lib/earnings-scraper.ts')

const PORTFOLIO_COMPANIES = ['MA', 'GOOGL', 'AMZN', 'META', 'NFLX', 'UBER', 'NVDA', 'MSFT', 'ASML', 'SPGI', 'TSM']

async function testAllCompanies() {
  console.log('🧪 Testing earnings URLs for all portfolio companies...\n')
  
  const currentYear = new Date().getFullYear().toString()
  const results = []
  
  for (const symbol of PORTFOLIO_COMPANIES) {
    console.log(`Testing ${symbol}...`)
    
    try {
      const testResult = await testCompanyURLs(symbol, currentYear)
      results.push(testResult)
      
      console.log(`✅ ${symbol}: ${testResult.validUrls}/${testResult.totalUrls} valid URLs`)
      
      // Show first few valid URLs
      const validUrls = testResult.results.filter(r => r.isValid)
      if (validUrls.length > 0) {
        console.log(`   🔗 Working: ${validUrls[0].url}`)
      }
      
    } catch (error) {
      console.log(`❌ ${symbol}: Error - ${error.message}`)
      results.push({
        symbol,
        totalUrls: 0,
        validUrls: 0,
        results: []
      })
    }
    
    console.log('')
  }
  
  // Summary
  console.log('\n📊 Summary Report:')
  console.log('==================')
  
  let totalValid = 0
  let totalUrls = 0
  
  results.forEach(result => {
    const percentage = result.totalUrls > 0 ? Math.round((result.validUrls / result.totalUrls) * 100) : 0
    console.log(`${result.symbol.padEnd(6)} | ${result.validUrls}/${result.totalUrls} valid (${percentage}%)`)
    totalValid += result.validUrls
    totalUrls += result.totalUrls
  })
  
  const overallPercentage = totalUrls > 0 ? Math.round((totalValid / totalUrls) * 100) : 0
  console.log('==================')
  console.log(`Overall: ${totalValid}/${totalUrls} valid URLs (${overallPercentage}%)`)
  
  // Recommendations
  console.log('\n💡 Recommendations:')
  const companiesWithIssues = results.filter(r => r.validUrls === 0)
  
  if (companiesWithIssues.length > 0) {
    console.log('⚠️  Companies needing URL pattern updates:')
    companiesWithIssues.forEach(company => {
      console.log(`   - ${company.symbol}`)
    })
  } else {
    console.log('🎉 All companies have working URLs!')
  }
}

// Run the test
if (require.main === module) {
  testAllCompanies().catch(console.error)
}

module.exports = { testAllCompanies }