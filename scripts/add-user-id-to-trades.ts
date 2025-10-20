import { addUserIdToTradeData } from '../lib/db-migrations'
import { logger } from '../lib/logger'

async function main() {
	try {
		console.log('Adding user_id to trade_data table...')
		await addUserIdToTradeData()
		console.log('✅ user_id column and indexes added successfully!')
		console.log('\nEnsure ADMIN_USER_ID is set to backfill existing rows to admin user.')
		process.exit(0)
	} catch (error) {
		logger.error('Failed to add user_id column:', error)
		console.error('❌ Failed to add user_id column:', error)
		process.exit(1)
	}
}

main()