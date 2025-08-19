import yahooFinance from 'yahoo-finance2'
import { logger } from './logger'

/**
 * Foreign exchange utilities
 * - Provides helpers to fetch FX rates for arbitrary currency pairs
 * - Routes via USD if direct pair is unavailable
 * - Supports single-day and time-series queries
 */

function normalizeCurrency(code: string): string {
  return (code || '').toUpperCase().trim()
}

function buildYahooSymbol(from: string, to: string): string {
  // Yahoo Finance uses e.g. NZDUSD=X meaning 1 NZD priced in USD
  return `${normalizeCurrency(from)}${normalizeCurrency(to)}=X`
}

function isSameCurrency(a: string, b: string): boolean {
  return normalizeCurrency(a) === normalizeCurrency(b)
}

/**
 * Get a single-day FX rate from one currency to another.
 * Returns the multiplier to convert FROM -> TO.
 * If direct pair is missing, routes via USD.
 */
export async function getFxRateOnDate(date: Date, from: string, to: string): Promise<number> {
  const fromCur = normalizeCurrency(from)
  const toCur = normalizeCurrency(to)
  if (isSameCurrency(fromCur, toCur)) return 1

  // Helper to fetch a direct pair for a specific date; returns null if unavailable
  const fetchDirect = async (base: string, quote: string): Promise<number | null> => {
    try {
      const symbol = buildYahooSymbol(base, quote)
      // Query a 2-day window [date, date+1] to get the closing for that day
      const period1 = new Date(date)
      const period2 = new Date(date)
      period2.setDate(period2.getDate() + 1)
      const quotes = await yahooFinance.historical(symbol, { period1, period2, interval: '1d' })
      if (quotes && quotes.length > 0 && quotes[0].close && quotes[0].close > 0) {
        return quotes[0].close
      }
      return null
    } catch (error) {
      logger.debug(`Direct FX fetch failed for ${base}/${quote} on ${date.toISOString().slice(0,10)}:`, error)
      return null
    }
  }

  // Try direct pair
  const direct = await fetchDirect(fromCur, toCur)
  if (direct && isFinite(direct)) return direct

  // Try inverse direct pair
  const inverse = await fetchDirect(toCur, fromCur)
  if (inverse && isFinite(inverse) && inverse !== 0) return 1 / inverse

  // Route via USD
  const usd = 'USD'
  const fromToUSD = isSameCurrency(fromCur, usd) ? 1 : (await fetchDirect(fromCur, usd)) ?? (async () => {
    const inv = await fetchDirect(usd, fromCur)
    return inv && inv !== 0 ? 1 / inv : null
  })()
  const usdToTo = isSameCurrency(toCur, usd) ? 1 : (await fetchDirect(usd, toCur)) ?? (async () => {
    const inv = await fetchDirect(toCur, usd)
    return inv && inv !== 0 ? 1 / inv : null
  })()

  const resolvedFromToUSD = await fromToUSD
  const resolvedUsdToTo = await usdToTo
  if (resolvedFromToUSD && resolvedUsdToTo) {
    return resolvedFromToUSD * resolvedUsdToTo
  }

  // As a last resort, return 1 to avoid NaN propagation
  logger.warn(`FX rate not found for ${fromCur}/${toCur} on ${date.toISOString().slice(0,10)}; defaulting to 1`)
  return 1
}

/**
 * Get a map of FX rates (FROM -> TO) for each date in [startDate, endDate], inclusive.
 * Fills forward missing dates.
 */
export async function getFxSeriesBetween(from: string, to: string, startDate: Date, endDate: Date): Promise<Map<string, number>> {
  const fromCur = normalizeCurrency(from)
  const toCur = normalizeCurrency(to)
  const result = new Map<string, number>()
  if (isSameCurrency(fromCur, toCur)) {
    const d = new Date(startDate)
    while (d <= endDate) {
      result.set(d.toISOString().split('T')[0], 1)
      d.setDate(d.getDate() + 1)
    }
    return result
  }

  // Try to fetch direct series first; otherwise inverse; otherwise route via USD per-day
  const tryDirectSeries = async (base: string, quote: string): Promise<Map<string, number> | null> => {
    try {
      const symbol = buildYahooSymbol(base, quote)
      const quotes = await yahooFinance.historical(symbol, { period1: startDate, period2: endDate, interval: '1d' })
      if (!quotes || quotes.length === 0) return null
      const m = new Map<string, number>()
      quotes.forEach(q => {
        const ds = q.date.toISOString().split('T')[0]
        if (q.close && q.close > 0) m.set(ds, q.close)
      })
      return m
    } catch (e) {
      return null
    }
  }

  let series: Map<string, number> | null = await tryDirectSeries(fromCur, toCur)
  if (!series) {
    const inv = await tryDirectSeries(toCur, fromCur)
    if (inv) {
      const inverted = new Map<string, number>()
      inv.forEach((v, k) => { if (v && v !== 0) inverted.set(k, 1 / v) })
      series = inverted
    }
  }

  if (!series) {
    // Route via USD per day
    const usd = 'USD'
    const fromToUSD = await tryDirectSeries(fromCur, usd) || (await (async () => {
      const inv = await tryDirectSeries(usd, fromCur)
      if (!inv) return null
      const inverted = new Map<string, number>()
      inv.forEach((v, k) => { if (v && v !== 0) inverted.set(k, 1 / v) })
      return inverted
    })())
    const usdToTo = await tryDirectSeries(usd, toCur) || (await (async () => {
      const inv = await tryDirectSeries(toCur, usd)
      if (!inv) return null
      const inverted = new Map<string, number>()
      inv.forEach((v, k) => { if (v && v !== 0) inverted.set(k, 1 / v) })
      return inverted
    })())

    if (fromToUSD && usdToTo) {
      const combined = new Map<string, number>()
      const allDates = new Set<string>([...fromToUSD.keys(), ...usdToTo.keys()])
      allDates.forEach(ds => {
        const a = fromToUSD.get(ds)
        const b = usdToTo.get(ds)
        if (a && b) combined.set(ds, a * b)
      })
      series = combined
    }
  }

  // Fill forward for the entire range
  const filled = new Map<string, number>()
  let last: number | null = null
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const ds = cur.toISOString().split('T')[0]
    if (series && series.has(ds)) {
      last = series.get(ds) || last
      if (last !== null) filled.set(ds, last)
    } else if (last !== null) {
      filled.set(ds, last)
    }
    cur.setDate(cur.getDate() + 1)
  }
  // If we never got any rate, default to 1s to keep app functional
  if (filled.size === 0) {
    const d = new Date(startDate)
    while (d <= endDate) {
      filled.set(d.toISOString().split('T')[0], 1)
      d.setDate(d.getDate() + 1)
    }
  }

  return filled
}

/**
 * Get a current FX rate (intraday) FROM -> TO using quote price.
 * If direct quote is not available, tries inverse and then USD routing.
 */
export async function getCurrentFxRate(from: string, to: string): Promise<number> {
  const fromCur = normalizeCurrency(from)
  const toCur = normalizeCurrency(to)
  if (isSameCurrency(fromCur, toCur)) return 1

  const tryDirectQuote = async (base: string, quote: string): Promise<number | null> => {
    try {
      const symbol = buildYahooSymbol(base, quote)
      const quoteData = await yahooFinance.quote(symbol)
      const p = (quoteData as any)?.regularMarketPrice
      return p && p > 0 ? p : null
    } catch {
      return null
    }
  }

  const direct = await tryDirectQuote(fromCur, toCur)
  if (direct) return direct
  const inverse = await tryDirectQuote(toCur, fromCur)
  if (inverse && inverse !== 0) return 1 / inverse

  // Route via USD
  const usd = 'USD'
  const a = isSameCurrency(fromCur, usd) ? 1 : (await tryDirectQuote(fromCur, usd)) || (async () => {
    const inv = await tryDirectQuote(usd, fromCur)
    return inv && inv !== 0 ? 1 / inv : null
  })()
  const b = isSameCurrency(toCur, usd) ? 1 : (await tryDirectQuote(usd, toCur)) || (async () => {
    const inv = await tryDirectQuote(toCur, usd)
    return inv && inv !== 0 ? 1 / inv : null
  })()

  const ra = await a
  const rb = await b
  if (ra && rb) return ra * rb
  return 1
}

