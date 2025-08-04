import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getNewsCacheKey } from '@/lib/edge-config'

interface CacheUpdateRequest {
  company: string
  startDate: string
  endDate: string
  data: any
}

// This endpoint updates the Edge Config store via Vercel API
export async function POST(request: Request) {
  try {
    const body: CacheUpdateRequest = await request.json()
    const { company, startDate, endDate, data } = body
    
    if (!company || !startDate || !endDate || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get Edge Config connection string
    const edgeConfigId = process.env.EDGE_CONFIG
    if (!edgeConfigId) {
      logger.warn('EDGE_CONFIG not set, skipping cache update')
      return NextResponse.json({ success: false, message: 'Edge Config not configured' })
    }
    
    // Extract the Edge Config ID from the connection string
    // Format: https://edge-config.vercel.com/<config-id>?token=<token>
    const configMatch = edgeConfigId.match(/edge-config\.vercel\.com\/([^?]+)/)
    if (!configMatch) {
      logger.error('Invalid EDGE_CONFIG format')
      return NextResponse.json({ success: false, message: 'Invalid Edge Config format' })
    }
    
    const configId = configMatch[1]
    const cacheKey = getNewsCacheKey(company)
    
    // Prepare cache value
    const cacheValue = {
      data,
      timestamp: new Date().toISOString(),
      dateRange: {
        start: startDate,
        end: endDate
      }
    }
    
    // Get Vercel API token
    const vercelToken = process.env.VERCEL_API_TOKEN
    
    // Debug logging
    logger.info('Environment check:', {
      hasEdgeConfig: !!edgeConfigId,
      hasVercelToken: !!vercelToken,
      tokenLength: vercelToken ? vercelToken.length : 0,
      tokenPrefix: vercelToken ? vercelToken.substring(0, 10) + '...' : 'none',
      nodeEnv: process.env.NODE_ENV
    })
    
    if (!vercelToken) {
      logger.info('VERCEL_API_TOKEN not set, cache update skipped')
      logger.info(`Would have cached: ${cacheKey}`, {
        company,
        status: data.status,
        summaryCount: data.summary_points?.length || 0
      })
      return NextResponse.json({ 
        success: false, 
        message: 'Vercel API token not configured',
        cacheKey,
        wouldCache: true
      })
    }
    
    // Get team ID if available (needed for team projects)
    const teamId = process.env.VERCEL_TEAM_ID || process.env.TEAM_ID_VERCEL
    
    // Update Edge Config via Vercel API
    const vercelApiUrl = `https://api.vercel.com/v1/edge-config/${configId}/items`
    
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      }
      
      // Add team ID if available
      if (teamId) {
        headers['x-vercel-team-id'] = teamId
      }
      
      logger.info(`Attempting to update Edge Config: ${configId}`, {
        cacheKey,
        hasTeamId: !!teamId
      })
      
      const response = await fetch(vercelApiUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: cacheKey,
              value: cacheValue
            }
          ]
        })
      })
      
      const responseText = await response.text()
      
      if (!response.ok) {
        logger.error('Failed to update Edge Config:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText
        })
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to update cache',
          error: responseText,
          status: response.status
        })
      }
      
      logger.info(`Successfully cached data for ${company} with key: ${cacheKey}`)
      return NextResponse.json({ 
        success: true, 
        cacheKey,
        cached: true
      })
      
    } catch (error: any) {
      logger.error('Error updating Edge Config:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Error updating cache',
        error: error.message 
      })
    }
    
  } catch (error: any) {
    logger.error('Error in cache update:', error)
    return NextResponse.json(
      { error: 'Failed to update cache' },
      { status: 500 }
    )
  }
}