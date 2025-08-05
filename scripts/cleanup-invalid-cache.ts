import { config } from 'dotenv'
import { getDb } from '../lib/db'

config()

async function cleanupInvalidCache() {
  console.log('🧹 Cleaning up invalid cache entries...\n')
  
  try {
    const sql = getDb()
    
    // Delete entries with no_significant_news_found status
    const noNewsDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'status' = 'no_significant_news_found'
      RETURNING id, company_name
    `
    
    if (noNewsDeleted.length > 0) {
      console.log(`❌ Deleted ${noNewsDeleted.length} entries with 'no_significant_news_found' status:`)
      noNewsDeleted.forEach(entry => {
        console.log(`   - ${entry.company_name} (ID: ${entry.id})`)
      })
    }
    
    // Delete entries with errors
    const errorDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'error' IS NOT NULL
      RETURNING id, company_name, response_data->>'error' as error
    `
    
    if (errorDeleted.length > 0) {
      console.log(`\n❌ Deleted ${errorDeleted.length} entries with errors:`)
      errorDeleted.forEach(entry => {
        console.log(`   - ${entry.company_name} (Error: ${entry.error})`)
      })
    }
    
    // Delete entries with news_found but no actual data
    const emptyDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'status' = 'news_found'
      AND (
        jsonb_array_length(COALESCE(response_data->'summary_points', '[]'::jsonb)) = 0
        OR jsonb_array_length(COALESCE(response_data->'references', '[]'::jsonb)) = 0
      )
      RETURNING id, company_name
    `
    
    if (emptyDeleted.length > 0) {
      console.log(`\n❌ Deleted ${emptyDeleted.length} entries with 'news_found' but empty data:`)
      emptyDeleted.forEach(entry => {
        console.log(`   - ${entry.company_name} (ID: ${entry.id})`)
      })
    }
    
    const totalDeleted = noNewsDeleted.length + errorDeleted.length + emptyDeleted.length
    
    if (totalDeleted === 0) {
      console.log('✅ No invalid entries found. Cache is clean!')
    } else {
      console.log(`\n✅ Total cleaned up: ${totalDeleted} entries`)
    }
    
    // Show remaining entries
    const remaining = await sql`
      SELECT COUNT(*) as count FROM application.news_cache
    `
    
    console.log(`\n📊 Remaining valid entries: ${remaining[0].count}`)
    
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
  
  process.exit(0)
}

cleanupInvalidCache()