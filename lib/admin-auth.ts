import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getStackServerApp } from "@/lib/stack-server-app"

export class AdminAccessError extends Error {
  constructor(message = "Administrator access required") {
    super(message)
    this.name = "AdminAccessError"
  }
}

function normalizeEmail(value?: string | null) {
  return (value || "").trim().toLowerCase()
}

function getAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
}

export async function getAdminContext(request: NextRequest | Request) {
  const stackApp = getStackServerApp()
  try {
    const user = await stackApp.getUser({
      or: "return-null",
      tokenStore: request,
    })
    const adminEmail = getAdminEmail()
    const userEmail = normalizeEmail(user?.primaryEmail)
    const isAdmin = Boolean(user && adminEmail && userEmail === adminEmail)

    return { user, isAdmin }
  } catch (error) {
    logger.error("Failed to resolve Stack user for request", error)
    return { user: null, isAdmin: false }
  }
}

export async function requireAdmin(request: NextRequest | Request) {
  const context = await getAdminContext(request)
  if (!context.isAdmin || !context.user) {
    throw new AdminAccessError()
  }
  return context
}

export async function guardAdminRoute(
  request: NextRequest,
  handler: (context: Awaited<ReturnType<typeof requireAdmin>>) => Promise<Response>
) {
  try {
    const context = await requireAdmin(request)
    return await handler(context)
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    throw error
  }
}
