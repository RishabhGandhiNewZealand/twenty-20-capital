import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// POST endpoint to invalidate portfolio cache only
export async function POST() {
  try {
    // Invalidate the master portfolio tag - this will clear ALL portfolio-related caches
    // All our unstable_cache functions are tagged with 'portfolio-all'
    await revalidateTag('portfolio-all')
    
    // Also invalidate individual tags for good measure
    await revalidateTag('trade-data')
    await revalidateTag('portfolio-history')
    await revalidateTag('portfolio-compositions')
    
    // Revalidate specific paths to ensure Next.js clears any page-level caching
    await revalidatePath('/portfolio', 'page')
    await revalidatePath('/trades', 'page')
    
    logger.info('Portfolio cache invalidated successfully - cleared all related caches via portfolio-all tag')
    
    return NextResponse.json({ 
      success: true,
      message: 'Portfolio cache invalidated successfully',
      invalidatedTags: ['portfolio-all', 'trade-data', 'portfolio-history', 'portfolio-compositions']
    })
  } catch (error) {
    logger.error('Error invalidating portfolio cache:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate portfolio cache' },
      { status: 500 }
    )
  }
}