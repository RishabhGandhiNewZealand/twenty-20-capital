// Test script to verify portfolio companies
const fs = require('fs');
const path = require('path');

async function testPortfolioCompanies() {
  try {
    // Check if TRADE_DATA_BLOB_URL is set
    if (!process.env.TRADE_DATA_BLOB_URL) {
      console.log('TRADE_DATA_BLOB_URL is not set. Using test data.');
      
      // Create test portfolio companies data
      const testData = {
        companies: [
          { symbol: 'AAPL', name: 'Apple Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'MSFT', name: 'Microsoft Corporation', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: false, wasExited: true },
          { symbol: 'NVDA', name: 'NVIDIA Corporation', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'META', name: 'Meta Platforms Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'TSLA', name: 'Tesla Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: false, wasExited: true },
          { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'V', name: 'Visa Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'JPM', name: 'JPMorgan Chase & Co.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'WMT', name: 'Walmart Inc.', instrumentCurrency: 'USD', marketCode: 'US', isCurrentHolding: true, wasExited: false },
          { symbol: 'MFT', name: 'Mainfreight Limited', instrumentCurrency: 'NZD', marketCode: 'NZ', isCurrentHolding: true, wasExited: false }
        ],
        totalCompanies: 12,
        currentHoldings: 10,
        exitedPositions: 2,
        lastUpdated: new Date().toISOString()
      };
      
      // Create directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write test data
      const outputPath = path.join(dataDir, 'portfolio-companies.json');
      fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));
      
      console.log('Created test portfolio companies data at:', outputPath);
      console.log('Total companies:', testData.totalCompanies);
      console.log('Current holdings:', testData.currentHoldings);
      console.log('Exited positions:', testData.exitedPositions);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPortfolioCompanies();