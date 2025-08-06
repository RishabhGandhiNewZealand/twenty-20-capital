import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // According to Vercel docs, cron jobs include authorization header
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
      logger.error('Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    logger.info('Cron job triggered for news cache population')
    
    // Get the deployment URL
    const deploymentUrl = process.env.VERCEL_URL || 'localhost:3000'
    const protocol = deploymentUrl.includes('localhost') ? 'http' : 'https'
    const apiUrl = `${protocol}://${deploymentUrl}/api/news/populate-cache`
    
    logger.info(`Calling cache population endpoint: ${apiUrl}`)
    
    // Call the cache population endpoint
    const result = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CACHE_POPULATE_SECRET || 'default-secret'}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!result.ok) {
      const error = await result.text()
      logger.error('Cache population failed:', error)
      return NextResponse.json({ 
        error: 'Cache population failed', 
        details: error 
      }, { status: result.status })
    }
    
    const data = await result.json()
    logger.info('Cache population completed:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Cache population triggered successfully',
      timestamp: new Date().toISOString(),
      result: data
    })
    
  } catch (error: any) {
    logger.error('Error in cron job:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger cache population',
      details: error.message 
    }, { status: 500 })
  }
}