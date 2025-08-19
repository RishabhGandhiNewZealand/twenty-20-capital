import { getDb } from './db'
import { logger } from './logger'

export interface UserPreferences {
  user_id: string
  default_currency: string
  created_at?: string
  updated_at?: string
}

export async function createUserPreferencesTable(): Promise<void> {
  const sql = getDb()
  try {
    await sql`CREATE SCHEMA IF NOT EXISTS application`
    await sql`
      CREATE TABLE IF NOT EXISTS application.user_preferences (
        user_id VARCHAR(255) PRIMARY KEY,
        default_currency VARCHAR(3) NOT NULL DEFAULT 'NZD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    await sql`
      CREATE OR REPLACE FUNCTION application.update_user_prefs_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `
    await sql`DROP TRIGGER IF EXISTS trg_user_prefs_updated_at ON application.user_preferences`
    await sql`
      CREATE TRIGGER trg_user_prefs_updated_at
      BEFORE UPDATE ON application.user_preferences
      FOR EACH ROW EXECUTE FUNCTION application.update_user_prefs_updated_at()
    `
  } catch (error) {
    logger.error('Error creating user_preferences table:', error)
  }
}

export async function getUserDefaultCurrency(userId: string): Promise<string> {
  if (!userId) return 'NZD'
  try {
    const sql = getDb()
    const res = await sql`SELECT default_currency FROM application.user_preferences WHERE user_id = ${userId}`
    if (res && res.length > 0 && res[0].default_currency) {
      return (res[0].default_currency as string).toUpperCase()
    }
  } catch (error) {
    logger.warn('getUserDefaultCurrency failed, defaulting to NZD:', error)
  }
  return 'NZD'
}

export async function upsertUserDefaultCurrency(userId: string, currency: string): Promise<void> {
  if (!userId) return
  const cur = (currency || 'NZD').toUpperCase()
  const sql = getDb()
  await sql`
    INSERT INTO application.user_preferences (user_id, default_currency)
    VALUES (${userId}, ${cur})
    ON CONFLICT (user_id) DO UPDATE SET default_currency = EXCLUDED.default_currency
  `
}

