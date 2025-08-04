import { config } from 'dotenv'
import { getDb, isDatabaseConfigured } from '../lib/db'
import { createNewsCache } from '../lib/db-migrations'
import { newsCache } from '../lib/news-cache'
import { logger } from '../lib/logger'

// Load environment variables
config()

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  if (!isDatabaseConfigured()) {
    console.error('❌ DATABASE_URL is not configured')
    console.log('Please set DATABASE_URL in your environment variables')
    return false
  }
  
  try {
    const sql = getDb()
    const result = await sql`SELECT NOW() as current_time`
    console.log('✅ Database connected successfully')
    console.log(`   Current database time: ${result[0].current_time}`)
    return true
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    return false
  }
}

async function testCacheOperations() {
  console.log('\n🔍 Testing cache operations...')
  
  try {
    // Initialize the cache
    await newsCache.initialize()
    console.log('✅ Cache initialized')
    
    // Test data
    const testCompany = 'Test Company Inc'
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    const testData = {
      company_name: testCompany,
      status: 'news_found' as const,
      summary_points: [
        '• Test news item 1',
        '• Test news item 2'
      ],
      references: [{
        title: 'Test Article',
        source_name: 'Test Source',
        url: 'https://example.com',
        publication_date: '2024-01-15',
        relevance: 'direct' as const
      }]
    }
    
    // Test cache miss
    console.log('\n📝 Testing cache miss...')
    const cacheMiss = await newsCache.get(testCompany, startDate, endDate)
    console.log(`   Cache miss result: ${cacheMiss === null ? 'null (expected)' : 'unexpected data'}`)
    
    // Test cache set
    console.log('\n📝 Testing cache set...')
    await newsCache.set(testCompany, startDate, endDate, testData) // Data stored forever
    console.log('   ✅ Data cached successfully')
    
    // Test cache hit
    console.log('\n📝 Testing cache hit...')
    const cacheHit = await newsCache.get(testCompany, startDate, endDate)
    if (cacheHit) {
      console.log('   ✅ Cache hit successful')
      console.log(`   Company: ${cacheHit.company_name}`)
      console.log(`   Status: ${cacheHit.status}`)
      console.log(`   Summary points: ${cacheHit.summary_points.length}`)
      console.log(`   References: ${cacheHit.references.length}`)
    } else {
      console.log('   ❌ Cache hit failed')
    }
    
    // Test cache statistics
    console.log('\n📊 Testing cache statistics...')
    const stats = await newsCache.getStats()
    if (stats) {
      console.log('   Cache Statistics:')
      console.log(`   - Total entries: ${stats.totalEntries}`)
      console.log(`   - Active entries: ${stats.activeEntries}`)
      console.log(`   - Expired entries: ${stats.expiredEntries}`)
      console.log(`   - Total requests: ${stats.totalRequests}`)
      console.log(`   - Avg requests per entry: ${stats.avgRequestsPerEntry.toFixed(2)}`)
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await newsCache.invalidate(testCompany)
    console.log('   ✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Cache operation failed:', error)
  }
}

async function main() {
  console.log('🚀 News Cache Test Script\n')
  
  // Test database connection
  const dbConnected = await testDatabaseConnection()
  
  if (!dbConnected) {
    console.log('\n⚠️  Please configure your database connection and try again')
    process.exit(1)
  }
  
  // Test cache operations
  await testCacheOperations()
  
  console.log('\n✅ All tests completed!')
  process.exit(0)
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})