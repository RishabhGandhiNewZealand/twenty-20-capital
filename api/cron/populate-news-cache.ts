import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  maxDuration: 300, // 5 minutes max execution time
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.authorization
    const cronSecret = process.env.CRON_SECRET || process.env.CACHE_POPULATE_SECRET
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return response.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get the deployment URL
    const deploymentUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'
    const protocol = deploymentUrl.includes('localhost') ? 'http' : 'https'
    const apiUrl = `${protocol}://${deploymentUrl}/api/news/populate-cache`
    
    console.log(`Triggering cache population at: ${apiUrl}`)
    
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
      console.error('Cache population failed:', error)
      return response.status(result.status).json({ 
        error: 'Cache population failed', 
        details: error 
      })
    }
    
    const data = await result.json()
    console.log('Cache population completed:', data)
    
    return response.status(200).json({
      success: true,
      message: 'Cache population triggered successfully',
      result: data
    })
    
  } catch (error: any) {
    console.error('Error in cron job:', error)
    return response.status(500).json({ 
      error: 'Failed to trigger cache population',
      details: error.message 
    })
  }
}