import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect internal API routes from browser access in production
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only apply protection to /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Public API routes that should always be accessible
  const publicRoutes = [
    // Add any API routes that should be publicly accessible
    // '/api/health',
    // '/api/auth',
  ]
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Get hostname to determine environment
  const hostname = request.nextUrl.hostname.toLowerCase()
  
  // Check if it's a local development environment
  const isLocalDev = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  
  // Check if it's a Vercel preview deployment
  // Preview deployments have branch names in the URL
  const isPreviewDeployment = 
    hostname.includes('-git-') || 
    hostname.includes('.preview.') ||
    // Check URL for common preview patterns
    (hostname.includes('-') && hostname.includes('.vercel.app') && 
     !hostname.match(/^[a-z0-9]+-[a-z0-9]+\.vercel\.app$/)) // Not a simple production pattern
  
  // If local or preview, allow all requests
  if (isLocalDev || isPreviewDeployment) {
    console.log(`[Middleware] Allowing request in ${isLocalDev ? 'development' : 'preview'}: ${pathname}`)
    return NextResponse.next()
  }
  
  // === PRODUCTION ENVIRONMENT - Apply strict protection ===
  console.log(`[Middleware] Production environment - checking request to ${pathname}`)
  
  // Get all relevant headers
  const headers = {
    accept: request.headers.get('accept') || '',
    contentType: request.headers.get('content-type') || '',
    secFetchMode: request.headers.get('sec-fetch-mode') || '',
    secFetchDest: request.headers.get('sec-fetch-dest') || '',
    secFetchSite: request.headers.get('sec-fetch-site') || '',
    xRequestedWith: request.headers.get('x-requested-with') || '',
    authorization: request.headers.get('authorization') || '',
    xApiKey: request.headers.get('x-api-key') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  }
  
  // Log for debugging
  console.log('[Middleware] Headers:', {
    accept: headers.accept.substring(0, 50),
    secFetchMode: headers.secFetchMode,
    secFetchDest: headers.secFetchDest,
    hasAuth: !!headers.authorization,
    hasApiKey: !!headers.xApiKey,
  })
  
  // === ALLOW CONDITIONS ===
  
  // 1. Allow if it has authentication headers
  if (headers.authorization || headers.xApiKey) {
    console.log('[Middleware] ✅ Allowed: Has authentication headers')
    return NextResponse.next()
  }
  
  // 2. Allow AJAX/fetch requests that expect JSON
  if (headers.xRequestedWith === 'XMLHttpRequest' || 
      (headers.accept.includes('application/json') && !headers.accept.includes('text/html'))) {
    console.log('[Middleware] ✅ Allowed: AJAX/JSON request')
    return NextResponse.next()
  }
  
  // 3. Allow POST/PUT/DELETE requests with JSON content
  if (request.method !== 'GET' && headers.contentType.includes('application/json')) {
    console.log('[Middleware] ✅ Allowed: Non-GET request with JSON content')
    return NextResponse.next()
  }
  
  // === BLOCK CONDITIONS ===
  
  // Block if it's a browser navigation request
  const isBrowserNavigation = 
    headers.secFetchMode === 'navigate' ||
    headers.secFetchDest === 'document' ||
    headers.secFetchDest === 'iframe' ||
    headers.secFetchDest === 'frame' ||
    // Fallback: Check if Accept header prefers HTML
    (headers.accept.includes('text/html') && 
     !headers.accept.includes('application/json'))
  
  if (isBrowserNavigation) {
    console.log('[Middleware] ❌ Blocked: Browser navigation request')
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Direct browser access to internal API routes is not allowed',
        status: 403,
        info: 'This endpoint requires proper API authentication or should be called via AJAX/fetch with JSON headers',
        hint: 'If you need to access this endpoint, use proper API headers or authentication',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Blocked-Reason': 'browser-navigation',
          'Cache-Control': 'no-store',
        },
      }
    )
  }
  
  // Default: In production, block GET requests without proper headers as a safety measure
  if (request.method === 'GET') {
    console.log('[Middleware] ❌ Blocked: GET request without API indicators')
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'API access requires proper authentication or JSON headers',
        status: 403,
        info: 'Add Accept: application/json header or use authentication',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Blocked-Reason': 'missing-api-headers',
          'Cache-Control': 'no-store',
        },
      }
    )
  }
  
  // Allow other requests by default (POST, PUT, DELETE without JSON content-type)
  console.log('[Middleware] ✅ Allowed: Default pass-through')
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all API routes
     */
    '/api/:path*',
  ],
}