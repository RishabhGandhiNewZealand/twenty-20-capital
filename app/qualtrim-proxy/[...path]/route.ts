import { NextRequest, NextResponse } from "next/server"

const UPSTREAM_ORIGIN = "https://www.qualtrim.com"

function buildUpstreamUrl(req: NextRequest, pathSegments?: string[]) {
  const upstreamPath = Array.isArray(pathSegments) && pathSegments.length > 0
    ? `/${pathSegments.join('/')}`
    : "/"
  const url = new URL(upstreamPath, UPSTREAM_ORIGIN)
  const reqUrl = new URL(req.url)
  reqUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value)
  })
  return url
}

function filterHeaders(original: Headers): Headers {
  const headers = new Headers()
  original.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (
      lower === "content-security-policy" ||
      lower === "x-frame-options" ||
      lower === "cross-origin-opener-policy" ||
      lower === "cross-origin-embedder-policy" ||
      lower === "cross-origin-resource-policy"
    ) {
      return
    }
    // Prevent upstream from setting HSTS for our domain via proxy
    if (lower === "strict-transport-security") return
    headers.set(key, value)
  })
  return headers
}

async function proxyRequest(req: NextRequest, context: { params: { path?: string[] } }) {
  const upstreamUrl = buildUpstreamUrl(req, context.params.path)

  const upstreamHeaders: HeadersInit = {}
  // Pass essential headers; avoid passing host
  const passThroughHeaders = [
    "accept",
    "accept-language",
    "user-agent",
    "cache-control",
    "pragma",
  ]
  passThroughHeaders.forEach((h) => {
    const v = req.headers.get(h)
    if (v) upstreamHeaders[h] = v
  })

  const upstreamRes = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers: upstreamHeaders,
    redirect: "follow",
    // Stream request body for non-GET/HEAD
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    // Do not send credentials cross-origin to upstream
    credentials: "omit",
    // Revalidate frequently; upstream assets are cacheable by CF/S3
    cache: "no-store",
  })

  const contentType = upstreamRes.headers.get("content-type") || ""
  const headers = filterHeaders(upstreamRes.headers)

  if (contentType.includes("text/html")) {
    let html = await upstreamRes.text()
    // Ensure all relative links stay within the proxy by updating base href
    // If a <base> tag exists with href="/", rewrite it; otherwise inject one
    if (html.includes("<base href=\"/\"")) {
      html = html.replace("<base href=\"/\"", "<base href=\"/qualtrim-proxy/\"")
    } else {
      html = html.replace(
        /<head(\s*>)/i,
        "<head$1<base href=\"/qualtrim-proxy/\">"
      )
    }
    // Also make sure any absolute root links like href="/..." use the proxy root
    html = html.replace(/href=\"\/(?!\/)/g, "href=\"/qualtrim-proxy/")
    html = html.replace(/src=\"\/(?!\/)/g, "src=\"/qualtrim-proxy/")

    headers.set("content-type", "text/html; charset=utf-8")
    return new NextResponse(html, { status: upstreamRes.status, headers })
  }

  const body = await upstreamRes.arrayBuffer()
  return new NextResponse(body, {
    status: upstreamRes.status,
    headers,
  })
}

export async function GET(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function HEAD(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function POST(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function PUT(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function PATCH(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function DELETE(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

export async function OPTIONS(req: NextRequest, context: { params: { path?: string[] } }) {
  return proxyRequest(req, context)
}

