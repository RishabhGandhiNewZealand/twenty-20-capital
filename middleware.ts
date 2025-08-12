import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  Environment, 
  RequestValidator, 
  APIProtectionConfig 
} from '@/lib/api-protection'

/**
 * Middleware to protect internal API routes from browser access in production
 * Allows access in:
 * - Preview deployments (Vercel preview environments)
 * - Development environment
 * - API calls from server-side or non-browser clients
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if this route should be protected
  if (!APIProtectionConfig.shouldProtectRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Check if request should be allowed
  if (RequestValidator.shouldAllowRequest(request)) {
    return NextResponse.next()
  }
  
  // Block the request - return 403 Forbidden
  const response = APIProtectionConfig.getBlockedResponse()
  return new NextResponse(
    JSON.stringify(response),
    {
      status: 403,
      headers: APIProtectionConfig.blockedResponseHeaders,
    }
  )
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - /_next (Next.js internals)
     * - /api/auth (if you want auth routes public, uncomment below)
     */
    '/api/:path*',
    // Exclude auth routes if needed:
    // '/((?!api/auth)api/.*)' 
  ],
}