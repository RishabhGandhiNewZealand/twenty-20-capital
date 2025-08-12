import type { NextRequest } from 'next/server'

/**
 * Environment detection utilities for API protection
 */
export const Environment = {
  /**
   * Check if running in Vercel environment
   */
  isVercel: () => process.env.VERCEL === '1',
  
  /**
   * Check if running in Vercel preview environment
   */
  isPreview: () => process.env.VERCEL_ENV === 'preview',
  
  /**
   * Check if running in production environment
   */
  isProduction: () => process.env.VERCEL_ENV === 'production',
  
  /**
   * Check if running in development environment
   */
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  /**
   * Check if API protection should be active
   * Protection is active in production (non-preview) Vercel environments
   */
  shouldProtectAPIs: () => {
    return Environment.isVercel() && 
           Environment.isProduction() && 
           !Environment.isPreview()
  }
}

/**
 * Request validation utilities
 */
export const RequestValidator = {
  /**
   * Check if request is coming from a browser
   */
  isBrowserRequest: (request: NextRequest): boolean => {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptHeader = request.headers.get('accept') || ''
    const secFetchMode = request.headers.get('sec-fetch-mode')
    const secFetchSite = request.headers.get('sec-fetch-site')
    const referer = request.headers.get('referer')
    
    return (
      // Navigation request (user typing URL in browser)
      secFetchMode === 'navigate' ||
      // Same-origin request from browser with referer
      (secFetchSite === 'same-origin' && !!referer) ||
      // Accept header indicates browser request for HTML
      (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) ||
      // Common browser user agents
      RequestValidator.hasBrowserUserAgent(userAgent)
    )
  },
  
  /**
   * Check if user agent is from a common browser
   */
  hasBrowserUserAgent: (userAgent: string): boolean => {
    const browserPatterns = [
      /Mozilla.*Chrome/i,
      /Mozilla.*Safari/i,
      /Mozilla.*Firefox/i,
      /Mozilla.*Edge/i,
      /Mozilla.*Opera/i,
    ]
    
    return browserPatterns.some(pattern => pattern.test(userAgent))
  },
  
  /**
   * Check if request has valid API headers
   */
  hasApiHeaders: (request: NextRequest): boolean => {
    return (
      // Has API key
      request.headers.has('x-api-key') ||
      // Has authorization header
      request.headers.has('authorization') ||
      // Is AJAX request
      request.headers.get('x-requested-with') === 'XMLHttpRequest' ||
      // Expects JSON response
      (request.headers.get('accept') || '').includes('application/json')
    )
  },
  
  /**
   * Check if request is from server-side rendering
   */
  isServerSideRequest: (request: NextRequest): boolean => {
    // Check for Next.js server-side rendering headers
    const hasNextHeaders = 
      request.headers.has('x-nextjs-data') ||
      request.headers.has('x-middleware-prefetch')
    
    // Check if request is from internal Next.js fetch
    const isInternalFetch = 
      request.headers.get('x-forwarded-host') === request.headers.get('host')
    
    return hasNextHeaders || isInternalFetch
  },
  
  /**
   * Determine if request should be allowed
   */
  shouldAllowRequest: (request: NextRequest): boolean => {
    // Always allow in development or preview
    if (Environment.isDevelopment() || Environment.isPreview()) {
      return true
    }
    
    // In production, check request source
    if (Environment.shouldProtectAPIs()) {
      // Allow server-side requests
      if (RequestValidator.isServerSideRequest(request)) {
        return true
      }
      
      // Allow requests with proper API headers
      if (RequestValidator.hasApiHeaders(request)) {
        return true
      }
      
      // Block browser requests without API headers
      if (RequestValidator.isBrowserRequest(request)) {
        return false
      }
    }
    
    // Default to allow
    return true
  }
}

/**
 * Configuration for API protection
 */
export const APIProtectionConfig = {
  /**
   * Routes that should always be public (even in production)
   * Add paths here if you want certain API routes to be accessible via browser
   */
  publicRoutes: [
    // Example: '/api/health',
    // Example: '/api/status',
  ],
  
  /**
   * Check if a route should be protected
   */
  shouldProtectRoute: (pathname: string): boolean => {
    // Check if route is in public routes list
    if (APIProtectionConfig.publicRoutes.some(route => pathname.startsWith(route))) {
      return false
    }
    
    // Protect all other API routes
    return pathname.startsWith('/api')
  },
  
  /**
   * Custom headers to add to blocked responses
   */
  blockedResponseHeaders: {
    'Content-Type': 'application/json',
    'X-API-Protection': 'active',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
  
  /**
   * Error response for blocked requests
   */
  getBlockedResponse: () => ({
    error: 'Forbidden',
    message: 'Direct browser access to internal API routes is not allowed in production environments',
    status: 403,
    info: 'This API endpoint is only accessible via server-side calls or authenticated API requests',
  })
}