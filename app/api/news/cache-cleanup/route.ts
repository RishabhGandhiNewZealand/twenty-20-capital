import { NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        message: 'Database not configured',
        cleaned: 0
      })
    }
    
    const sql = getDb()
    
    // Delete entries with no_significant_news_found status
    const noNewsDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'status' = 'no_significant_news_found'
      RETURNING id, company_name
    `
    
    // Delete entries with errors
    const errorDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'error' IS NOT NULL
      RETURNING id, company_name
    `
    
    // Delete entries with news_found but no actual data
    const emptyDeleted = await sql`
      DELETE FROM application.news_cache
      WHERE response_data->>'status' = 'news_found'
      AND (
        jsonb_array_length(COALESCE(response_data->'summary_points', '[]'::jsonb)) = 0
        OR jsonb_array_length(COALESCE(response_data->'references', '[]'::jsonb)) = 0
      )
      RETURNING id, company_name
    `
    
    const totalDeleted = noNewsDeleted.length + errorDeleted.length + emptyDeleted.length
    
    logger.info(`Cache cleanup completed: ${totalDeleted} invalid entries removed`)
    
    return NextResponse.json({
      success: true,
      cleaned: {
        total: totalDeleted,
        noNews: noNewsDeleted.length,
        errors: errorDeleted.length,
        emptyData: emptyDeleted.length
      },
      details: {
        noNewsCompanies: noNewsDeleted.map(e => e.company_name),
        errorCompanies: errorDeleted.map(e => e.company_name),
        emptyDataCompanies: emptyDeleted.map(e => e.company_name)
      }
    })
    
  } catch (error: any) {
    logger.error('Error during cache cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to clean up cache', message: error.message },
      { status: 500 }
    )
  }
}