import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { getCompanyColor } from '@/lib/company-colors'
import { guardAdminRoute } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const EXCHANGE_SUFFIXES = ['', '.NZ', '.AX', '.TO', '.L', '.PA', '.DE', '.HK', '.SW', '.MI']
const DOMAIN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const domainCache = new Map<string, { domain: string | null, expiresAt: number }>()

function getContentType(ext: string): string {
	if (ext === 'svg') return 'image/svg+xml'
	if (ext === 'png') return 'image/png'
	if (ext === 'webp') return 'image/webp'
	if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
	return 'application/octet-stream'
}

async function resolveCompanyWebsite(symbol: string): Promise<string | null> {
	const candidates = Array.from(new Set(EXCHANGE_SUFFIXES.map(s => `${symbol}${s}`)))
	for (const candidate of candidates) {
		try {
			// Use quoteSummary to access assetProfile.website when available
			// @ts-ignore - module type for quoteSummary varies
			const summary = await yahooFinance.quoteSummary(candidate, { modules: ['assetProfile'] })
			const website = summary?.assetProfile?.website as string | undefined
			if (website && typeof website === 'string') {
				return website
			}
		} catch (error) {
			// Try next candidate silently
		}
	}
	return null
}

function extractDomain(website: string): string | null {
	try {
		const hasProtocol = /^https?:\/\//i.test(website)
		const url = new URL(hasProtocol ? website : `https://${website}`)
		return url.hostname.replace(/^www\./, '')
	} catch {
		return null
	}
}

async function resolveDomainWithCache(symbolUpper: string): Promise<string | null> {
  const cached = domainCache.get(symbolUpper)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.domain
  }
  const website = await resolveCompanyWebsite(symbolUpper)
  const domain = website ? extractDomain(website) : null
  domainCache.set(symbolUpper, { domain, expiresAt: now + DOMAIN_TTL_MS })
  return domain
}

export async function GET(req: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  return guardAdminRoute(req, async () => {
    const { symbol } = await context.params
    const symbolParam = symbol
    if (!symbolParam || typeof symbolParam !== 'string') {
      return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
    }

    const url = new URL(req.url)
    const sizeParam = url.searchParams.get('size')
    const size = Math.max(16, Math.min(256, Number(sizeParam) || 64))

      // Resolve company website via Yahoo and proxy Clearbit logo
    try {
      const domain = await resolveDomainWithCache(symbolParam.toUpperCase())
      if (domain) {
        const clearbitUrl = `https://logo.clearbit.com/${domain}?size=${size}`
        const resp = await fetch(clearbitUrl)
        if (resp.ok && resp.headers.get('content-type')?.startsWith('image/')) {
          const buffer = Buffer.from(await resp.arrayBuffer())
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': resp.headers.get('content-type') || 'image/png',
              'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400'
            }
          })
        }
      }
    } catch (error) {
      logger.warn('Logo remote fetch error', { symbol: symbolParam, error })
    }

      // No logo available from website → return 404 per requirement
      return NextResponse.json({ error: 'Logo not available' }, { status: 404 })
  })
}

