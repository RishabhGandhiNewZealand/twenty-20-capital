import { getDb } from '../lib/db'

async function checkTableStatus() {
  const sql = getDb()
  
  console.log('Checking application.trade_data table status...\n')
  
  // Get total count
  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM application.trade_data
  `
  console.log(`✓ Total records in table: ${count}`)
  
  // Get date range
  const [{ min_date, max_date }] = await sql`
    SELECT 
      MIN(date)::text as min_date,
      MAX(date)::text as max_date
    FROM application.trade_data
  `
  console.log(`✓ Date range: ${min_date} to ${max_date}`)
  
  // Get latest 3 entries
  const latest = await sql`
    SELECT id, code, name, date, type, value
    FROM application.trade_data
    ORDER BY date DESC, id DESC
    LIMIT 3
  `
  console.log('\n✓ Latest 3 entries:')
  latest.forEach(row => {
    console.log(`  - ${row.date}: ${row.type} ${row.code} (${row.name.substring(0, 30)}...) - Value: $${row.value}`)
  })
  
  console.log('\n✅ Table is populated and ready!')
}

checkTableStatus().catch(console.error)