# CSV to Neon Database Migration

This directory contains scripts to migrate CSV data from Vercel Blob storage to a Neon PostgreSQL database.

## Prerequisites

1. **Environment Variables**: Ensure the following environment variables are set:
   - `DATABASE_URL`: Your Neon database connection string
   - `TRADE_DATA_BLOB_URL`: The URL to your CSV file in Vercel Blob storage
   - `BLOB_READ_WRITE_TOKEN`: Vercel Blob access token (optional, for SDK access)

2. **Dependencies**: The project dependencies should already be installed via npm/pnpm.

## Migration Scripts

### TypeScript Version (`migrate-csv-to-neon.ts`)

For use within the Next.js project with TypeScript support:

```bash
# Using npm
npm run tsx scripts/migrate-csv-to-neon.ts

# Using pnpm
pnpm tsx scripts/migrate-csv-to-neon.ts

# Using npx
npx tsx scripts/migrate-csv-to-neon.ts
```

### JavaScript Version (`migrate-csv-to-neon.js`)

Standalone JavaScript version that can be run directly with Node.js:

```bash
node scripts/migrate-csv-to-neon.js
```

## What the Migration Does

1. **Downloads CSV Data**: Fetches the CSV file from Vercel Blob storage
2. **Parses CSV Content**: Extracts trade records from the CSV
3. **Creates Database Table**: Creates a `trade_data` table with the following schema:
   - `id`: Serial primary key
   - `code`: Stock symbol/code
   - `market_code`: Market identifier
   - `name`: Company name
   - `date`: Transaction date
   - `type`: Transaction type (Buy/Sell/Reinvestment)
   - `qty`: Quantity
   - `price`: Price per unit
   - `instrument_currency`: Currency of the instrument
   - `brokerage`: Brokerage fee
   - `brokerage_currency`: Currency of brokerage fee
   - `exch_rate`: Exchange rate
   - `value`: Total transaction value
   - `created_at`: Timestamp of record creation
   - `updated_at`: Timestamp of last update

4. **Creates Indexes**: Adds indexes on `code`, `date`, and `type` columns for better query performance
5. **Inserts Data**: Batch inserts all trade records (100 records per batch)
6. **Verifies Migration**: Displays statistics and sample data

## Table Schema

```sql
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
);
```

## Important Notes

- **Data Replacement**: The migration will DROP the existing `trade_data` table if it exists
- **Batch Processing**: Data is inserted in batches of 100 records for efficiency
- **Error Handling**: The script includes comprehensive error handling and logging
- **Data Types**: All numeric fields use `DECIMAL(20, 6)` for high precision financial data

## Using the Migrated Data

After migration, you can query the data using the Neon database connection:

```typescript
import { getDb } from '@/lib/db'

const sql = getDb()
const trades = await sql`SELECT * FROM trade_data WHERE code = 'AAPL' ORDER BY date DESC`
```

## Troubleshooting

1. **Database Connection Error**: Verify your `DATABASE_URL` is correct and the database is accessible
2. **Blob Download Error**: Check that `TRADE_DATA_BLOB_URL` is valid and accessible
3. **CSV Parse Error**: Ensure the CSV format matches the expected structure (12+ columns)
4. **Permission Error**: Ensure your database user has CREATE TABLE and INSERT permissions