import { getEarningsData } from '../lib/earnings-data'

async function testEarnings() {
  console.log('Testing earnings data fetching...')
  
  const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'MFT', 'BRK.B']
  
  for (const symbol of testSymbols) {
    console.log(`\nFetching earnings for ${symbol}...`)
    try {
      const data = await getEarningsData(symbol)
      console.log(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error)
    }
  }
}

testEarnings().catch(console.error)