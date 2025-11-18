import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAdminContext } from "@/lib/admin-auth"

export async function middleware(request: NextRequest) {
  const { isAdmin } = await getAdminContext(request)

  if (isAdmin) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  if (!request.nextUrl.pathname.startsWith("/login")) {
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search)
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/capital-appreciation-fund/:path*",
    "/analyses/:path*",
    "/reports/:path*",
    "/investment-thesis/:path*",
    "/news/:path*",
    "/trades/:path*",
    "/api/:path*",
  ],
}
