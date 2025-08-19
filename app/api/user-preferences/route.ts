import { NextRequest, NextResponse } from 'next/server'
import { getUserDefaultCurrency, upsertUserDefaultCurrency, createUserPreferencesTable } from '@/lib/user-preferences'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await createUserPreferencesTable()
    const currency = await getUserDefaultCurrency(userId)
    return NextResponse.json({ defaultCurrency: currency })
  } catch (error) {
    logger.error('Failed to get user preferences:', error)
    return NextResponse.json({ error: 'Failed to get user preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const currency = (body?.defaultCurrency || 'NZD').toString()
    await createUserPreferencesTable()
    await upsertUserDefaultCurrency(userId, currency)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to update user preferences:', error)
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 })
  }
}

