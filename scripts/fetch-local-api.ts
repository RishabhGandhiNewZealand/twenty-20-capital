async function main() {
  try {
    const response = await fetch('http://localhost:3000/api/portfolio-current')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('\n=== LOCAL API PORTFOLIO CURRENT RESPONSE ===')
    console.log('Last Updated:', data.lastUpdated)
    console.log('Summary:', JSON.stringify(data.summary, null, 2))
    
    console.log('\nHoldings count:', data.holdings.length)
    console.log('First 5 holdings:')
    data.holdings.slice(0, 5).forEach((h: any) => {
      console.log(`- ${h.symbol}: shares=${h.shares}, currentPrice=${h.currentPrice}, valNZD=${h.currentValueNZD}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error fetching local API:', error)
    process.exit(1)
  }
}

main()
