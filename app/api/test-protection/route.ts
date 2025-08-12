import { NextResponse } from 'next/server'
import { Environment } from '@/lib/api-protection'

/**
 * Test endpoint to verify API protection middleware
 * GET /api/test-protection
 * 
 * This endpoint helps verify that:
 * - Browser access is blocked in production (non-preview) environments
 * - API access with proper headers is allowed
 * - Access is allowed in preview and development environments
 */
export async function GET() {
  const environment = {
    isVercel: Environment.isVercel(),
    isPreview: Environment.isPreview(),
    isProduction: Environment.isProduction(),
    isDevelopment: Environment.isDevelopment(),
    shouldProtectAPIs: Environment.shouldProtectAPIs(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercel: process.env.VERCEL,
  }
  
  return NextResponse.json({
    message: 'API Protection Test Endpoint',
    status: 'accessible',
    description: 'If you can see this response, the request was allowed through the middleware',
    environment,
    timestamp: new Date().toISOString(),
    protection: {
      active: Environment.shouldProtectAPIs(),
      info: Environment.shouldProtectAPIs() 
        ? 'API protection is ACTIVE - browser requests should be blocked'
        : 'API protection is INACTIVE - all requests are allowed',
    }
  })
}