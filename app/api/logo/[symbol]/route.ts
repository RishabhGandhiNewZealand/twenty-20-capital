import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { logger } from '@/lib/logger'
import { getCompanyColor } from '@/lib/company-colors'

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

const MANUAL_DOMAIN_MAP: Record<string, string> = {
	// Tech
	'AAPL': 'apple.com',
	'MSFT': 'microsoft.com',
	'GOOG': 'abc.xyz',
	'GOOGL': 'abc.xyz',
	'AMZN': 'amazon.com',
	'META': 'meta.com',
	'TSLA': 'tesla.com',
	'NVDA': 'nvidia.com',
	'NFLX': 'netflix.com',
	'ADBE': 'adobe.com',
	'CRM': 'salesforce.com',
	'INTC': 'intel.com',
	'AMD': 'amd.com',
	'QCOM': 'qualcomm.com',
	'IBM': 'ibm.com',
	'ORCL': 'oracle.com',
	'CSCO': 'cisco.com',
	'TXN': 'ti.com',
	'AVGO': 'broadcom.com',
	'SHOP': 'shopify.com',
	'SPOT': 'spotify.com',
	'SNAP': 'snap.com',
	'UBER': 'uber.com',
	'LYFT': 'lyft.com',
	'ABNB': 'airbnb.com',
	'SQ': 'block.xyz',
	'PYPL': 'paypal.com',
	'COIN': 'coinbase.com',
	'HOOD': 'robinhood.com',
	'PLTR': 'palantir.com',
	'U': 'unity.com',
	'RBLX': 'roblox.com',
	'TTD': 'thetradedesk.com',
	'OKTA': 'okta.com',
	'TEAM': 'atlassian.com',
	'TWLO': 'twilio.com',
	'DOCU': 'docusign.com',
	'ZM': 'zoom.us',
	'CRWD': 'crowdstrike.com',
	'ZS': 'zscaler.com',
	'NET': 'cloudflare.com',
	'DDOG': 'datadoghq.com',
	'MDB': 'mongodb.com',
	'SNOW': 'snowflake.com',
	'PANW': 'paloaltonetworks.com',
	'FTNT': 'fortinet.com',

	// Consumer
	'DIS': 'disney.com',
	'NKE': 'nike.com',
	'SBUX': 'starbucks.com',
	'MCD': 'mcdonalds.com',
	'WMT': 'walmart.com',
	'TGT': 'target.com',
	'COST': 'costco.com',
	'HD': 'homedepot.com',
	'LOW': 'lowes.com',
	'KO': 'coca-colacompany.com',
	'PEP': 'pepsico.com',
	'PG': 'pg.com',
	'CL': 'colgatepalmolive.com',
	'JNJ': 'jnj.com',
	'PFE': 'pfizer.com',
	'MRK': 'merck.com',
	'ABBV': 'abbvie.com',
	'LLY': 'lilly.com',
	'UNH': 'unitedhealthgroup.com',
	'CVS': 'cvs.com',
	'MC.PA': 'lvmh.com',
	'OR.PA': 'loreal.com',
	'RMS.PA': 'hermes.com',
	'KER.PA': 'kering.com',

	// Finance
	'V': 'visa.com',
	'MA': 'mastercard.com',
	'AXP': 'americanexpress.com',
	'JPM': 'jpmorganchase.com',
	'BAC': 'bankofamerica.com',
	'WFC': 'wellsfargo.com',
	'C': 'citigroup.com',
	'MS': 'morganstanley.com',
	'GS': 'goldmansachs.com',
	'BLK': 'blackrock.com',
	'BRK.A': 'berkshirehathaway.com',
	'BRK.B': 'berkshirehathaway.com',

	// Indices / ETFs
	'VOO': 'investor.vanguard.com',
	'VTI': 'investor.vanguard.com',
	'QQQ': 'invesco.com',
	'SPY': 'ssga.com',
	'IVV': 'ishares.com',
};

async function fetchLogoFromDomain(domain: string, size: number): Promise<Response | null> {
	// 1. Try Clearbit
	try {
		const clearbitUrl = `https://logo.clearbit.com/${domain}?size=${size}`
		const resp = await fetch(clearbitUrl)
		if (resp.ok && resp.headers.get('content-type')?.startsWith('image/')) {
			return resp
		}
	} catch (e) { /* ignore */ }

	// 2. Try DuckDuckGo Favicon (works as fallback)
	try {
		const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`
		const resp = await fetch(ddgUrl)
		if (resp.ok && resp.headers.get('content-type')?.startsWith('image/')) {
			return resp
		}
	} catch (e) { /* ignore */ }

	// 3. Try Google Favicon (last resort)
	try {
		const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
		const resp = await fetch(googleUrl)
		if (resp.ok && resp.headers.get('content-type')?.startsWith('image/')) {
			return resp
		}
	} catch (e) { /* ignore */ }

	return null
}

export async function GET(req: Request, context: { params: Promise<{ symbol: string }> }) {
	const { symbol } = await context.params
	const symbolParam = symbol
	if (!symbolParam || typeof symbolParam !== 'string') {
		return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
	}

	const url = new URL(req.url)
	const sizeParam = url.searchParams.get('size')
	const size = Math.max(16, Math.min(256, Number(sizeParam) || 64))

	let domain: string | null = null;

	// 1. Check Manual Map
	if (MANUAL_DOMAIN_MAP[symbolParam.toUpperCase()]) {
		domain = MANUAL_DOMAIN_MAP[symbolParam.toUpperCase()];
	} else {
		// 2. Resolve via Yahoo
		try {
			domain = await resolveDomainWithCache(symbolParam.toUpperCase())
		} catch (error) {
			logger.warn('Logo remote fetch error', { symbol: symbolParam, error })
		}
	}

	if (domain) {
		const resp = await fetchLogoFromDomain(domain, size);
		if (resp) {
			const buffer = Buffer.from(await resp.arrayBuffer())
			return new NextResponse(buffer, {
				headers: {
					'Content-Type': resp.headers.get('content-type') || 'image/png',
					'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400'
				}
			})
		}
	}

	// No logo available from website → return 404 per requirement
	return NextResponse.json({ error: 'Logo not available' }, { status: 404 })
}

