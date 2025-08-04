import { config } from 'dotenv'
import { getDb } from '../lib/db'

config()

async function checkCacheData() {
  console.log('Checking cache data...')
  
  try {
    const sql = getDb()
    const entries = await sql`SELECT * FROM application.news_cache ORDER BY created_at DESC`
    
    console.log(`Found ${entries.length} cache entries`)
    
    entries.forEach((entry: any) => {
      console.log(`\nCompany: ${entry.company_name}`)
      console.log(`Cache Key: ${entry.cache_key}`)
      console.log(`Created: ${entry.created_at}`)
      console.log(`Request Count: ${entry.request_count}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

checkCacheData()