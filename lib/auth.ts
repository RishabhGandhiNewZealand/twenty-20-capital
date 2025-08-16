import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { logger } from "./logger"

// Get the current user from Clerk
export async function getCurrentUser() {
  try {
    const user = await currentUser()
    return user
  } catch (error) {
    logger.error("Error getting current user:", error)
    return null
  }
}

// Get the current user ID
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth()
    return userId
  } catch (error) {
    logger.error("Error getting current user ID:", error)
    return null
  }
}

// Middleware to require authentication
export async function requireAuth() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }
  
  return { id: userId }
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