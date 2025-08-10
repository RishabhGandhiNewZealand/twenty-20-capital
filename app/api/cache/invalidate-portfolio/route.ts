import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// POST endpoint to invalidate portfolio cache only
export async function POST() {
  try {
    // Invalidate all portfolio-related cache tags
    // This will clear the portfolio data cache but NOT the news cache
    await revalidateTag('trade-data')
    await revalidateTag('portfolio-history')
    await revalidateTag('portfolio-compositions')
    
    // Also revalidate the portfolio page paths to ensure fresh data
    await revalidatePath('/portfolio')
    await revalidatePath('/api/portfolio')
    await revalidatePath('/api/portfolio-current')
    await revalidatePath('/api/portfolio-history')
    await revalidatePath('/api/portfolio-compositions')
    
    logger.info('Portfolio cache invalidated successfully - cleared all related caches')
    
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