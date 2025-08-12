import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Test endpoint to verify API protection middleware
 * GET /api/test-protection
 * 
 * This endpoint helps verify that:
 * - Browser access is blocked in production (non-preview) environments
 * - API access with proper headers is allowed
 * - Access is allowed in preview and development environments
 */
export async function GET(request: Request) {
  const headersList = headers()
  const url = new URL(request.url)
  
  // Get request headers for debugging
  const requestHeaders: Record<string, string> = {}
  headersList.forEach((value, key) => {
    // Only include relevant headers for debugging
    if (key.startsWith('sec-') || 
        key.startsWith('x-') || 
        key === 'accept' || 
        key === 'user-agent' ||
        key === 'referer') {
      requestHeaders[key] = value.substring(0, 100) // Truncate long values
    }
  })
  
  const environment = {
    hostname: url.hostname,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercel: process.env.VERCEL,
    isProduction: process.env.VERCEL_ENV === 'production',
    isPreview: process.env.VERCEL_ENV === 'preview',
    isDevelopment: process.env.NODE_ENV === 'development',
  }
  
  return NextResponse.json({
    message: '⚠️ API Protection Test - This endpoint should be blocked in production!',
    status: 'accessible',
    warning: 'If you can see this in a browser on production, the middleware is NOT working correctly',
    environment,
    requestInfo: {
      url: url.href,
      hostname: url.hostname,
      headers: requestHeaders,
    },
    timestamp: new Date().toISOString(),
    protection: {
      expectedBehavior: {
        production: 'Should return 403 Forbidden for browser requests',
        preview: 'Should allow all requests',
        development: 'Should allow all requests'
      },
      currentEnvironment: environment.isProduction ? 'production' : 
                         environment.isPreview ? 'preview' : 'development'
    }
  })
}