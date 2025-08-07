const { list, head } = require('@vercel/blob');
const { neon } = require('@neondatabase/serverless');

// Logger utility
const logger = {
  info: (...args) => console.log('[INFO]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args) => console.log('[DEBUG]', new Date().toISOString(), ...args)
};

// Extract pathname from Vercel Blob URL
function extractPathnameFromBlobUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
  } catch (error) {
    throw new Error(`Invalid blob URL: ${url}`);
  }
}

// Download trade data from Vercel Blob
async function downloadTradeDataFromBlob() {
  try {
    const TRADE_DATA_BLOB_URL = process.env.TRADE_DATA_BLOB_URL;
    
    if (!TRADE_DATA_BLOB_URL) {
      throw new Error('TRADE_DATA_BLOB_URL environment variable is not configured');
    }

    // For local development or when BLOB_READ_WRITE_TOKEN is not available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.debug('BLOB_READ_WRITE_TOKEN not found, fetching directly from URL');
      const response = await fetch(TRADE_DATA_BLOB_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to download blob: ${response.statusText}`);
      }
      
      return await response.text();
    }

    // Extract pathname from the full URL
    const pathname = extractPathnameFromBlobUrl(TRADE_DATA_BLOB_URL);
    
    // Get blob metadata
    const blobMetadata = await head(pathname);
    
    if (!blobMetadata) {
      throw new Error('Trade data blob not found');
    }
    
    logger.debug('Found trade data blob', { 
      pathname: blobMetadata.pathname,
      size: blobMetadata.size,
      uploadedAt: blobMetadata.uploadedAt 
    });
    
    // Download the blob content
    const response = await fetch(blobMetadata.downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    logger.error('Error downloading trade data from blob:', error);
    throw new Error('Failed to download trade data from blob storage');
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse CSV data
function parseCSVData(csvContent) {
  const lines = csvContent.trim().split('\n');
  const trades = [];
  
  // Skip header and last line (Total row)
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    
    if (fields.length >= 12) {
      const trade = {
        code: fields[0],
        marketCode: fields[1],
        name: fields[2],
        date: fields[3],
        type: fields[4],
        qty: parseFloat(fields[5]),
        price: parseFloat(fields[6]),
        instrumentCurrency: fields[7],
        brokerage: parseFloat(fields[8]),
        brokerageCurrency: fields[9],
        exchRate: parseFloat(fields[10]),
        value: parseFloat(fields[11].replace(/[",]/g, ''))
      };
      
      trades.push(trade);
    }
  }
  
  return trades;
}

// Main migration function
async function migrateCSVToNeon() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const sql = neon(databaseUrl);
  
  try {
    logger.info('Starting CSV to Neon migration...');
    
    // Step 1: Download CSV from Vercel Blob
    logger.info('Downloading CSV from Vercel Blob...');
    const csvContent = await downloadTradeDataFromBlob();
    logger.info('CSV downloaded successfully');
    
    // Step 2: Parse CSV data
    logger.info('Parsing CSV data...');
    const trades = parseCSVData(csvContent);
    logger.info(`Parsed ${trades.length} trade records`);
    
    if (trades.length === 0) {
      throw new Error('No trade records found in CSV');
    }
    
    // Step 3: Create table schema
    logger.info('Creating trade_data table...');
    
    // Drop table if exists
    await sql`DROP TABLE IF EXISTS trade_data CASCADE`;
    
    // Create table
    const createTableQuery = `
      CREATE TABLE trade_data (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        market_code TEXT NOT NULL,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell', 'Reinvestment')),
        qty DECIMAL(20, 6) NOT NULL,
        price DECIMAL(20, 6) NOT NULL,
        instrument_currency TEXT NOT NULL,
        brokerage DECIMAL(20, 6) NOT NULL,
        brokerage_currency TEXT NOT NULL,
        exch_rate DECIMAL(20, 6) NOT NULL,
        value DECIMAL(20, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql(createTableQuery);
    logger.info('Table created successfully');
    
    // Create indexes
    await sql`CREATE INDEX idx_trade_data_code ON trade_data(code)`;
    await sql`CREATE INDEX idx_trade_data_date ON trade_data(date)`;
    await sql`CREATE INDEX idx_trade_data_type ON trade_data(type)`;
    logger.info('Indexes created successfully');
    
    // Step 4: Insert data in batches
    logger.info('Inserting trade data...');
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      
      // Prepare batch insert values
      const values = batch.map(trade => ({
        code: trade.code,
        market_code: trade.marketCode,
        name: trade.name,
        date: trade.date,
        type: trade.type,
        qty: trade.qty,
        price: trade.price,
        instrument_currency: trade.instrumentCurrency,
        brokerage: trade.brokerage,
        brokerage_currency: trade.brokerageCurrency,
        exch_rate: trade.exchRate,
        value: trade.value
      }));
      
      // Insert batch
      await sql`
        INSERT INTO trade_data (
          code, market_code, name, date, type, qty, price,
          instrument_currency, brokerage, brokerage_currency, exch_rate, value
        )
        VALUES ${sql(values)}
      `;
      
      insertedCount += batch.length;
      logger.info(`Inserted ${insertedCount}/${trades.length} records`);
    }
    
    // Step 5: Verify migration
    const count = await sql`SELECT COUNT(*) as count FROM trade_data`;
    const totalCount = parseInt(count[0].count);
    
    logger.info(`Migration completed successfully! Total records in database: ${totalCount}`);
    
    // Display sample data
    const sample = await sql`SELECT * FROM trade_data LIMIT 5`;
    logger.info('Sample data from migrated table:');
    console.table(sample);
    
    // Display table statistics
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT code) as unique_symbols,
        COUNT(DISTINCT market_code) as unique_markets,
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        SUM(value) as total_value
      FROM trade_data
    `;
    logger.info('Table statistics:');
    console.table(stats);
    
    return {
      success: true,
      recordsInserted: totalCount,
      stats: stats[0]
    };
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Execute migration
if (require.main === module) {
  migrateCSVToNeon()
    .then(result => {
      logger.info('Migration completed:', result);
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCSVToNeon };