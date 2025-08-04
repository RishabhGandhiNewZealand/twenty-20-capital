import { config } from 'dotenv'
import { getDb } from '../lib/db'

config()

async function checkAllEntries() {
  console.log('🔍 Checking ALL cache entries...\n')
  
  try {
    const sql = getDb()
    
    // Get all entries with status
    const entries = await sql`
      SELECT 
        id,
        company_name,
        cache_key,
        response_data->>'status' as status,
        response_data->>'error' as error,
        jsonb_array_length(COALESCE(response_data->'summary_points', '[]'::jsonb)) as summary_count,
        jsonb_array_length(COALESCE(response_data->'references', '[]'::jsonb)) as reference_count,
        created_at,
        request_count
      FROM application.news_cache
      ORDER BY created_at DESC
    `
    
    console.log(`Total entries: ${entries.length}\n`)
    
    // Group by status
    const byStatus: Record<string, any[]> = {}
    entries.forEach(entry => {
      const status = entry.status || 'unknown'
      if (!byStatus[status]) byStatus[status] = []
      byStatus[status].push(entry)
    })
    
    // Show entries by status
    Object.entries(byStatus).forEach(([status, statusEntries]) => {
      console.log(`\n📊 Status: ${status} (${statusEntries.length} entries)`)
      console.log('─'.repeat(50))
      
      statusEntries.forEach(entry => {
        console.log(`Company: ${entry.company_name}`)
        console.log(`  - Key: ${entry.cache_key}`)
        console.log(`  - Summaries: ${entry.summary_count}, References: ${entry.reference_count}`)
        console.log(`  - Error: ${entry.error || 'none'}`)
        console.log(`  - Created: ${entry.created_at}`)
        console.log(`  - Requests: ${entry.request_count}`)
        console.log('')
      })
    })
    
    // Show problematic entries
    const problematic = entries.filter(e => 
      e.status === 'no_significant_news_found' || 
      e.error ||
      (e.status === 'news_found' && (e.summary_count === 0 || e.reference_count === 0))
    )
    
    if (problematic.length > 0) {
      console.log('\n⚠️  PROBLEMATIC ENTRIES THAT SHOULD NOT BE CACHED:')
      console.log('═'.repeat(50))
      problematic.forEach(entry => {
        console.log(`\n❌ ${entry.company_name}`)
        console.log(`   Status: ${entry.status}`)
        console.log(`   Error: ${entry.error || 'none'}`)
        console.log(`   Summaries: ${entry.summary_count}, References: ${entry.reference_count}`)
        console.log(`   ID: ${entry.id}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

checkAllEntries()