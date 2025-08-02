import { parseCSVData, calculatePortfolioData } from '@/lib/portfolio'
import { logger } from '@/lib/logger'
import fs from 'fs/promises'
import path from 'path'

interface CachedCompany {
  symbol: string
  name: string
  instrumentCurrency: string
  marketCode: string
  isCurrentHolding: boolean
  wasExited: boolean
}

async function downloadTradeData(): Promise<string> {
  const url = process.env.TRADE_DATA_BLOB_URL
  if (!url) {
    throw new Error('TRADE_DATA_BLOB_URL environment variable is not set')
  }
  console.log('Downloading trade data from blob storage...')
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download data: ${response.statusText}`)
  }
  return await response.text()
}

async function cachePortfolioCompanies() {
  try {
    console.log('Starting portfolio companies caching...')
    
    // Download CSV data
    const csvContent = await downloadTradeData()
    const trades = parseCSVData(csvContent)
    
    // Calculate current holdings and exited positions
    const { holdings, exitedPositions } = calculatePortfolioData(trades)
    
    // Create a map of all unique companies
    const companiesMap = new Map<string, CachedCompany>()
    
    // Add current holdings
    holdings.forEach(holding => {
      companiesMap.set(holding.symbol, {
        symbol: holding.symbol,
        name: holding.name,
        instrumentCurrency: holding.instrumentCurrency,
        marketCode: holding.marketCode,
        isCurrentHolding: true,
        wasExited: false
      })
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      const existing = companiesMap.get(position.symbol)
      if (existing) {
        // Company was exited and then re-entered
        existing.wasExited = true
      } else {
        companiesMap.set(position.symbol, {
          symbol: position.symbol,
          name: position.name,
          instrumentCurrency: position.instrumentCurrency,
          marketCode: position.marketCode,
          isCurrentHolding: false,
          wasExited: true
        })
      }
    })
    
    // Convert to array and sort by symbol
    const companies = Array.from(companiesMap.values()).sort((a, b) => 
      a.symbol.localeCompare(b.symbol)
    )
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'public', 'data', 'portfolio-companies.json')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, JSON.stringify({
      companies,
      totalCompanies: companies.length,
      currentHoldings: companies.filter(c => c.isCurrentHolding).length,
      exitedPositions: companies.filter(c => c.wasExited && !c.isCurrentHolding).length,
      lastUpdated: new Date().toISOString()
    }, null, 2))
    
    console.log(`Successfully cached ${companies.length} portfolio companies`)
    console.log(`Current holdings: ${companies.filter(c => c.isCurrentHolding).length}`)
    console.log(`Exited positions: ${companies.filter(c => c.wasExited && !c.isCurrentHolding).length}`)
    console.log(`Output saved to: ${outputPath}`)
    
  } catch (error) {
    console.error('Error caching portfolio companies:', error)
    process.exit(1)
  }
}

// Run the caching script
cachePortfolioCompanies()