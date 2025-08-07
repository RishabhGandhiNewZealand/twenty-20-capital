import { NextRequest, NextResponse } from 'next/server'
import { migrateCSVToNeon } from '@/lib/migrate-to-neon'
import { logger } from '@/lib/logger'

// This API route allows triggering the migration via HTTP request
// It should be protected in production with authentication

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('authorization')
    // if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    logger.info('Migration API endpoint called')
    
    // Run the migration
    const result = await migrateCSVToNeon()
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      result
    })
  } catch (error) {
    logger.error('Migration API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 })
  }
}

// GET method to check migration status or provide info
export async function GET() {
  return NextResponse.json({
    message: 'CSV to Neon Migration API',
    endpoint: '/api/admin/migrate-to-neon',
    method: 'POST',
    description: 'Triggers migration of CSV data from Vercel Blob to Neon database',
    warning: 'This will DROP and recreate the trade_data table!'
  })
}