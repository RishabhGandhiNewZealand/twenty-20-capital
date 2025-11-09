import { NextRequest, NextResponse } from 'next/server'
import { getUserDb } from '@/lib/rls-auth'
import { logger } from '@/lib/logger'

/**
 * Delete a watchlist item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    const userEmail = request.headers.get('x-user-email') || ''
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const watchlistId = parseInt(params.id)
    
    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      )
    }

    const sql = getUserDb(userId)
    
    // Delete watchlist item (scenarios will be cascade deleted)
    const result = await sql`
      DELETE FROM application.watchlist
      WHERE id = ${watchlistId} AND user_id = ${userId}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist item not found or unauthorized' },
        { status: 404 }
      )
    }
    
    logger.info(`Deleted watchlist item ${watchlistId} for user ${userEmail}`)
    
    return NextResponse.json({ 
      success: true 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    logger.error('Error deleting watchlist item:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete watchlist item', details: errorMessage },
      { status: 500 }
    )
  }
}
