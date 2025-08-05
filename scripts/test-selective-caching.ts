import { config } from 'dotenv'
import { newsCache } from '../lib/news-cache'
import { logger } from '../lib/logger'

// Load environment variables
config()

async function testSelectiveCaching() {
  console.log('🔍 Testing Selective Caching\n')
  
  try {
    // Initialize cache
    await newsCache.initialize()
    
    const scenarios = [
      {
        name: 'Success Case',
        company: 'Company With News',
        data: {
          company_name: 'Company With News',
          status: 'news_found' as const,
          summary_points: ['• Important news 1', '• Important news 2'],
          references: [{
            title: 'News Article',
            source_name: 'Reuters',
            url: 'https://example.com',
            publication_date: '2024-01-15',
            relevance: 'direct' as const
          }]
        },
        shouldCache: true
      },
      {
        name: 'No News Found',
        company: 'Company No News',
        data: {
          company_name: 'Company No News',
          status: 'no_significant_news_found' as const,
          summary_points: [],
          references: []
        },
        shouldCache: false
      },
      {
        name: 'Error Case',
        company: 'Company With Error',
        data: {
          company_name: 'Company With Error',
          status: 'no_significant_news_found' as const,
          summary_points: [],
          references: [],
          error: 'API rate limit exceeded'
        },
        shouldCache: false
      },
      {
        name: 'Empty Data Despite Status',
        company: 'Company Empty Data',
        data: {
          company_name: 'Company Empty Data',
          status: 'news_found' as const,
          summary_points: [],
          references: []
        },
        shouldCache: false
      }
    ]
    
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    
    for (const scenario of scenarios) {
      console.log(`\n📝 Testing: ${scenario.name}`)
      console.log(`   Company: ${scenario.company}`)
      console.log(`   Should Cache: ${scenario.shouldCache}`)
      
      // Apply the same logic as in the API
      const shouldCache = scenario.data && 
                         scenario.data.status === 'news_found' && 
                         !scenario.data.error &&
                         scenario.data.summary_points && 
                         scenario.data.summary_points.length > 0 &&
                         scenario.data.references &&
                         scenario.data.references.length > 0
      
      console.log(`   Logic Result: ${shouldCache}`)
      
      if (shouldCache) {
        await newsCache.set(scenario.company, startDate, endDate, scenario.data)
        console.log('   ✅ Data cached')
      } else {
        console.log('   ⏭️  Cache skipped')
      }
      
      // Verify cache state
      const cached = await newsCache.get(scenario.company, startDate, endDate)
      const isCached = cached !== null
      
      if (scenario.shouldCache === isCached) {
        console.log(`   ✅ Verification passed: ${isCached ? 'Found in cache' : 'Not in cache'}`)
      } else {
        console.log(`   ❌ Verification failed: Expected ${scenario.shouldCache ? 'cached' : 'not cached'}, but got ${isCached ? 'cached' : 'not cached'}`)
      }
    }
    
    // Show final cache stats
    console.log('\n📊 Final Cache Statistics:')
    const stats = await newsCache.getStats()
    if (stats) {
      console.log(`   Total entries: ${stats.totalEntries}`)
      console.log(`   Active entries: ${stats.activeEntries}`)
      console.log(`   Total requests: ${stats.totalRequests}`)
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    for (const scenario of scenarios) {
      await newsCache.invalidate(scenario.company)
    }
    console.log('   ✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSelectiveCaching().then(() => {
  console.log('\n✅ All tests completed!')
  process.exit(0)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})