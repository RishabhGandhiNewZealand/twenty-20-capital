import { StackServerApp } from "@stackframe/stack"
import { NextRequest, NextResponse } from "next/server"
import { logger } from "./logger"

// Initialize Stack app
let stackApp: StackServerApp | null = null

export function getStackApp() {
  if (!stackApp) {
    const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID
    const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
    const secretKey = process.env.STACK_SECRET_SERVER_KEY

    if (!projectId || !publishableKey || !secretKey) {
      throw new Error("Stack authentication environment variables are not configured")
    }

    stackApp = new StackServerApp({
      projectId,
      publishableClientKey: publishableKey,
      secretServerKey: secretKey,
      tokenStore: "nextjs-cookie",
    })
  }

  return stackApp
}

// Get the current user from the request
export async function getCurrentUser(request: NextRequest) {
  try {
    const app = getStackApp()
    const user = await app.getUser({ request })
    return user
  } catch (error) {
    logger.error("Error getting current user:", error)
    return null
  }
}

// Middleware to require authentication
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }
  
  return user
}

// Check if the current user is an admin
export async function isAdmin(userId: string): Promise<boolean> {
  const adminUserId = process.env.ADMIN_USER_ID
  return adminUserId === userId
}

// Create an authenticated response with proper headers
export function createAuthenticatedResponse(
  data: any,
  options?: ResponseInit
): NextResponse {
  return NextResponse.json(data, {
    ...options,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options?.headers,
    },
  })
}

// Verify user has access to specific resource
export async function verifyUserAccess(
  userId: string,
  resourceUserId: string
): Promise<boolean> {
  // Users can only access their own resources
  // Admin can only access their own resources (not other users')
  return userId === resourceUserId
}

// Get user ID from various sources (for backward compatibility)
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // First try to get from Stack authentication
  const user = await getCurrentUser(request)
  if (user) {
    return user.id
  }
  
  // Fallback to header-based auth (for migration period)
  const authHeader = request.headers.get('x-user-id')
  if (authHeader) {
    logger.warn('Using legacy x-user-id header - should migrate to Stack auth')
    return authHeader
  }
  
  return null
}