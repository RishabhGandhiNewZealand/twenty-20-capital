import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

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
    if (lower === "strict-transport-security") return
    headers.set(key, value)
  })
  return headers
}

function rewriteHtmlForProxy(html: string): string {
  // Normalize or inject <base>
  if (/<base[^>]*>/i.test(html)) {
    html = html.replace(/<base[^>]*>/i, '<base href="/qualtrim-proxy/">')
  } else {
    html = html.replace(/<head(\s*>)/i, '<head$1<base href="/qualtrim-proxy/">')
  }
  // Inject a small script early to prevent service worker registration within the iframe scope
  html = html.replace(
    /<head(\s*>)/i,
    '<head$1<script>(function(){try{if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});try{navigator.serviceWorker.register=function(){return Promise.resolve({})}}catch(e){}}}catch(e){}})();</script>'
  )
  // Prefix absolute root URLs that are not already prefixed with /qualtrim-proxy/
  html = html.replace(/href=\"\/(?!qualtrim-proxy\/|\/)/g, 'href="/qualtrim-proxy/')
  html = html.replace(/src=\"\/(?!qualtrim-proxy\/|\/)/g, 'src="/qualtrim-proxy/')
  return html
}

async function proxyRequest(req: NextRequest, context: { params: { path?: string[] } }) {
  const upstreamUrl = buildUpstreamUrl(req, context.params.path)

  const upstreamHeaders: HeadersInit = {}
  const passThroughHeaders = ["accept","accept-language","user-agent","cache-control","pragma"]
  passThroughHeaders.forEach((h) => {
    const v = req.headers.get(h)
    if (v) upstreamHeaders[h] = v
  })

  const upstreamRes = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers: upstreamHeaders,
    redirect: "follow",
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    credentials: "omit",
    cache: "no-store",
  })

  const contentType = upstreamRes.headers.get("content-type") || ""
  const headers = filterHeaders(upstreamRes.headers)

  if (contentType.includes("text/html")) {
    const originalHtml = await upstreamRes.text()
    const html = rewriteHtmlForProxy(originalHtml)
    headers.set("content-type", "text/html; charset=utf-8")
    return new NextResponse(html, { status: upstreamRes.status, headers })
  }

  const body = await upstreamRes.arrayBuffer()
  return new NextResponse(body, { status: upstreamRes.status, headers })
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

