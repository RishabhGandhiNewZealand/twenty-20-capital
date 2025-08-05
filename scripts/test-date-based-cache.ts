import { config } from 'dotenv'
import { newsCache } from '../lib/news-cache'
import { getDb } from '../lib/db'
import { logger } from '../lib/logger'

// Load environment variables
config()

async function testDateBasedCache() {
  console.log('🔍 Testing Date-Based Cache Retrieval\n')
  
  try {
    // Initialize cache
    await newsCache.initialize()
    const sql = getDb()
    
    // Test data
    const testCompany = 'Test Company Date'
    const testData = {
      company_name: testCompany,
      status: 'news_found' as const,
      summary_points: ['• Important news 1', '• Important news 2'],
      references: [{
        title: 'News Article',
        source_name: 'Reuters',
        url: 'https://example.com',
        publication_date: '2024-01-15',
        relevance: 'direct' as const
      }]
    }
    
    // Clean up any existing test data
    await newsCache.invalidate(testCompany)
    
    // Test 1: Fresh cache (end date = today)
    console.log('📝 Test 1: Fresh cache (end date = today)')
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    const freshStartDate = thirtyDaysAgo.toISOString().split('T')[0]
    const freshEndDate = today.toISOString().split('T')[0]
    
    await newsCache.set(testCompany, freshStartDate, freshEndDate, testData)
    console.log(`   Cached data with end date: ${freshEndDate}`)
    
    const freshResult = await newsCache.get(testCompany, freshStartDate, freshEndDate)
    console.log(`   Result: ${freshResult ? '✅ Found (fresh)' : '❌ Not found'}`)
    
    // Test 2: Stale cache (end date = 10 days ago)
    console.log('\n📝 Test 2: Stale cache (end date = 10 days ago)')
    await newsCache.invalidate(testCompany)
    
    const staleEndDate = new Date()
    staleEndDate.setDate(today.getDate() - 10)
    const staleStartDate = new Date()
    staleStartDate.setDate(staleEndDate.getDate() - 30)
    
    const staleStartDateStr = staleStartDate.toISOString().split('T')[0]
    const staleEndDateStr = staleEndDate.toISOString().split('T')[0]
    
    // Manually insert stale data
    await sql`
      INSERT INTO application.news_cache (
        company_name, 
        cache_key, 
        response_data, 
        start_date, 
        end_date, 
        expires_at,
        created_at
      ) VALUES (
        ${testCompany},
        ${`${testCompany.toLowerCase().replace(/\s+/g, '_')}_${staleStartDateStr}_${staleEndDateStr}`},
        ${JSON.stringify(testData)},
        ${staleStartDateStr},
        ${staleEndDateStr},
        ${new Date(2124, 0, 1).toISOString()},
        ${new Date().toISOString()}
      )
    `
    console.log(`   Cached data with end date: ${staleEndDateStr} (10 days ago)`)
    
    const staleResult = await newsCache.get(testCompany, staleStartDateStr, staleEndDateStr)
    console.log(`   Result: ${staleResult ? '❌ Found (should not be)' : '✅ Not found (correct)'}`)
    
    // Test 3: Edge case - exactly 7 days old
    console.log('\n📝 Test 3: Edge case (end date = exactly 7 days ago)')
    await newsCache.invalidate(testCompany)
    
    const edgeEndDate = new Date()
    edgeEndDate.setDate(today.getDate() - 7)
    const edgeStartDate = new Date()
    edgeStartDate.setDate(edgeEndDate.getDate() - 30)
    
    const edgeStartDateStr = edgeStartDate.toISOString().split('T')[0]
    const edgeEndDateStr = edgeEndDate.toISOString().split('T')[0]
    
    await sql`
      INSERT INTO application.news_cache (
        company_name, 
        cache_key, 
        response_data, 
        start_date, 
        end_date, 
        expires_at,
        created_at
      ) VALUES (
        ${testCompany},
        ${`${testCompany.toLowerCase().replace(/\s+/g, '_')}_${edgeStartDateStr}_${edgeEndDateStr}`},
        ${JSON.stringify(testData)},
        ${edgeStartDateStr},
        ${edgeEndDateStr},
        ${new Date(2124, 0, 1).toISOString()},
        ${new Date().toISOString()}
      )
    `
    console.log(`   Cached data with end date: ${edgeEndDateStr} (exactly 7 days ago)`)
    
    const edgeResult = await newsCache.get(testCompany, edgeStartDateStr, edgeEndDateStr)
    console.log(`   Result: ${edgeResult ? '✅ Found (within 7 days)' : '❌ Not found'}`)
    
    // Test 4: Multiple entries - should get the most recent
    console.log('\n📝 Test 4: Multiple entries (should get most recent)')
    await newsCache.invalidate(testCompany)
    
    // Insert older entry
    const olderEndDate = new Date()
    olderEndDate.setDate(today.getDate() - 5)
    await sql`
      INSERT INTO application.news_cache (
        company_name, cache_key, response_data, start_date, end_date, expires_at, created_at
      ) VALUES (
        ${testCompany},
        ${`${testCompany.toLowerCase().replace(/\s+/g, '_')}_older`},
        ${JSON.stringify({...testData, summary_points: ['• Older news']})},
        ${olderEndDate.toISOString().split('T')[0]},
        ${olderEndDate.toISOString().split('T')[0]},
        ${new Date(2124, 0, 1).toISOString()},
        ${new Date(Date.now() - 86400000).toISOString()} -- yesterday
      )
    `
    
    // Insert newer entry
    const newerEndDate = new Date()
    newerEndDate.setDate(today.getDate() - 2)
    await sql`
      INSERT INTO application.news_cache (
        company_name, cache_key, response_data, start_date, end_date, expires_at, created_at
      ) VALUES (
        ${testCompany},
        ${`${testCompany.toLowerCase().replace(/\s+/g, '_')}_newer`},
        ${JSON.stringify({...testData, summary_points: ['• Newer news']})},
        ${newerEndDate.toISOString().split('T')[0]},
        ${newerEndDate.toISOString().split('T')[0]},
        ${new Date(2124, 0, 1).toISOString()},
        ${new Date().toISOString()} -- today
      )
    `
    
    const multiResult = await newsCache.get(testCompany, '', '')
    if (multiResult) {
      console.log(`   ✅ Found entry with summaries: ${multiResult.summary_points[0]}`)
      console.log(`   ${multiResult.summary_points[0].includes('Newer') ? '✅ Got most recent' : '❌ Got wrong entry'}`)
    } else {
      console.log('   ❌ No entry found')
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...')
    await newsCache.invalidate(testCompany)
    console.log('   ✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDateBasedCache().then(() => {
  console.log('\n✅ All tests completed!')
  process.exit(0)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})