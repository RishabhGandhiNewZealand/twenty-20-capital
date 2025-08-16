import { neon } from '@neondatabase/serverless'

export function getUserDb(userId: string) {
	// In serverless environments, do NOT set PostgreSQL session variables.
	// Always enforce user scoping with explicit WHERE clauses.
	const databaseUrl = process.env.DATABASE_URL
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set')
	}
	return neon(databaseUrl)
}