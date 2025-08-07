import { logger } from '../lib/logger'

async function populatePortfolioCache() {
  try {
    console.log('Populating portfolio compositions cache...')
    
    // Make a request to the API endpoint to trigger cache population
    const response = await fetch('http://localhost:3000/api/portfolio-compositions')
    
    if (!response.ok) {
      throw new Error(`Failed to populate cache: ${response.statusText}`)
    }
    
    const data = await response.json()
    const dates = Object.keys(data)
    
    console.log(`✅ Successfully cached portfolio compositions for ${dates.length} dates`)
    console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`)
    
    process.exit(0)
  } catch (error) {
    logger.error('Failed to populate portfolio cache:', error)
    console.error('❌ Failed to populate portfolio cache:', error)
    process.exit(1)
  }
}

// Check if running in development
if (!process.env.NEXT_PUBLIC_VERCEL_URL && !process.env.VERCEL_URL) {
  console.log('Note: This script should be run after starting the Next.js development server')
  console.log('Run: npm run dev (in another terminal)')
  console.log('Then run this script')
}

// Run the script
populatePortfolioCache()