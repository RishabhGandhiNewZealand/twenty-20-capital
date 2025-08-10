import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'

// POST endpoint to invalidate portfolio cache only
export async function POST() {
  try {
    // Invalidate only the trade-data cache tag
    // This will clear the portfolio data cache but NOT the news cache
    await revalidateTag('trade-data')
    
    logger.info('Portfolio cache invalidated successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Portfolio cache invalidated successfully'
    })
  } catch (error) {
    logger.error('Error invalidating portfolio cache:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate portfolio cache' },
      { status: 500 }
    )
  }
}