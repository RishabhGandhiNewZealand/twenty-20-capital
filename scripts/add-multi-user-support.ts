import { addMultiUserSupport, migrateExistingDataToUser } from '../lib/db-migrations'
import { logger } from '../lib/logger'

async function main() {
  try {
    console.log('Adding multi-user support to the database...')
    
    // Add user_id column and enable RLS
    await addMultiUserSupport()
    
    console.log('✅ Multi-user support added successfully!')
    
    // Check if we should migrate existing data to a specific user
    const adminUserId = process.env.ADMIN_USER_ID
    if (adminUserId) {
      console.log(`\nMigrating existing data to admin user: ${adminUserId}`)
      const migratedCount = await migrateExistingDataToUser(adminUserId)
      console.log(`✅ Migrated ${migratedCount} existing trades to admin user`)
    } else {
      console.log('\n⚠️  No ADMIN_USER_ID environment variable set.')
      console.log('Existing data has not been assigned to any user.')
      console.log('To migrate existing data, set ADMIN_USER_ID and run this script again.')
    }
    
    console.log('\n✅ Database is now ready for multi-user support!')
    console.log('\nNext steps:')
    console.log('1. Ensure all API endpoints use authentication')
    console.log('2. Update queries to filter by user_id')
    console.log('3. Test RLS policies with different users')
    
    process.exit(0)
  } catch (error) {
    logger.error('Failed to add multi-user support:', error)
    console.error('❌ Failed to add multi-user support:', error)
    process.exit(1)
  }
}

// Run the script
main()