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
  
  // Check if this is the PRODUCTION domain
  const isProduction = 
    hostname === 'rishinvests.xyz' ||
    hostname === 'www.rishinvests.xyz'
  
  // If NOT production and NOT localhost, it's a preview/staging environment
  // This includes all Vercel preview URLs, v0 deployments, etc.
  if (!isProduction) {
    if (isLocalDev) {
      console.log(`[Middleware] Allowing request in development: ${pathname}`)
    } else {
      console.log(`[Middleware] Allowing request in preview/staging (${hostname}): ${pathname}`)
    }
    return NextResponse.next()
  }
  
  // === PRODUCTION ENVIRONMENT (rishinvests.xyz) - Apply strict protection ===
  console.log(`[Middleware] PRODUCTION environment detected (${hostname}) - checking request to ${pathname}`)
  
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
    
    // Return HTML error page for browser requests
    const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 - API Access Forbidden</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h1 { font-size: 72px; margin: 0 0 20px; font-weight: bold; }
        h2 { font-size: 28px; margin: 0 0 20px; font-weight: 300; }
        p { font-size: 18px; line-height: 1.6; margin: 20px 0; opacity: 0.9; }
        .icon { font-size: 100px; margin-bottom: 20px; }
        code { background: rgba(255, 255, 255, 0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace; }
        a { color: white; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔒</div>
        <h1>403</h1>
        <h2>API Access Forbidden</h2>
        <p>Direct browser access to internal API endpoints is not allowed on <strong>rishinvests.xyz</strong>.</p>
        <p>These endpoints are designed to be accessed programmatically with proper authentication.</p>
        <p style="margin-top: 40px; font-size: 14px; opacity: 0.7;">
            <a href="/">Return to Homepage</a>
        </p>
    </div>
</body>
</html>`
    
    return new NextResponse(htmlResponse, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
        'X-Blocked-Reason': 'browser-navigation',
        'Cache-Control': 'no-store',
      },
    })
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