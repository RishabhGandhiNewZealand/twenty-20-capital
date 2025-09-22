import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import path from 'path'
import { promises as fs } from 'fs'
import { logger } from '@/lib/logger'
import { getCompanyColor } from '@/lib/company-colors'

export const runtime = 'nodejs'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const IMAGE_EXTS = ['svg', 'png', 'webp', 'jpg', 'jpeg'] as const
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

async function tryLocalAsset(symbol: string): Promise<{ buffer: Buffer, contentType: string } | null> {
	const upper = symbol.toUpperCase()
	const lower = symbol.toLowerCase()
	for (const ext of IMAGE_EXTS) {
		const candidates = [
			path.join(PUBLIC_DIR, `${upper}.${ext}`),
			path.join(PUBLIC_DIR, `${lower}.${ext}`)
		]
		for (const p of candidates) {
			try {
				const buffer = await fs.readFile(p)
				return { buffer, contentType: getContentType(ext) }
			} catch {
				// continue
			}
		}
	}
	return null
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

function generatePlaceholderSvg(symbol: string, size: number = 64): string {
	const bg = getCompanyColor(symbol.toUpperCase())
	const text = symbol.toUpperCase().slice(0, 5)
	const fontSize = Math.max(14, Math.floor(size * 0.42))
	return `<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		`<rect width="100%" height="100%" fill="${bg}" rx="${Math.round(size * 0.18)}"/>` +
		`<text x="50%" y="54%" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" font-weight="700" font-size="${fontSize}" fill="white">${text}</text>` +
		`</svg>`
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

export async function GET(req: Request, { params }: { params: { symbol: string } }) {
	const symbolParam = params.symbol
	if (!symbolParam || typeof symbolParam !== 'string') {
		return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
	}

	const url = new URL(req.url)
	const sizeParam = url.searchParams.get('size')
	const size = Math.max(16, Math.min(256, Number(sizeParam) || 64))

	// 1) Local asset by symbol
	try {
		const local = await tryLocalAsset(symbolParam)
		if (local) {
			return new NextResponse(local.buffer, {
				headers: {
					'Content-Type': local.contentType,
					'Cache-Control': 'public, max-age=31536000, immutable'
				}
			})
		}
	} catch (error) {
		logger.warn('Logo local lookup error', { symbol: symbolParam, error })
	}

	// 2) Resolve company website via Yahoo and proxy Clearbit logo
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

	// 3) Generated SVG placeholder as a final fallback
	const svg = generatePlaceholderSvg(symbolParam, size)
	return new NextResponse(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=86400'
		}
	})
}

