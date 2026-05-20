async function main() {
  try {
    const response = await fetch('http://localhost:3000/api/portfolio-history')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('\n=== LOCAL API PORTFOLIO HISTORY RESPONSE ===')
    if (data.history && data.history.length > 0) {
      console.log('History data points count:', data.history.length)
      console.log('Last 5 days in history:')
      data.history.slice(-5).forEach((h: any) => {
        console.log(`- Date: ${h.date} | Value: ${h.portfolioValue} | CostBasis: ${h.costBasis} | SP500: ${h.sp500Value}`)
      })
    } else {
      console.log('No history data returned')
    }
    process.exit(0)
  } catch (error) {
    console.error('Error fetching history API:', error)
    process.exit(1)
  }
}

main()
