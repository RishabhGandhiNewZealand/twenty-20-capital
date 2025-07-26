import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { FALLBACK_USD_TO_NZD_RATE } from '@/lib/constants'

export async function GET() {
  try {
    // Using a free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const usdToNzd = data.rates.NZD

    return NextResponse.json({
      rate: usdToNzd,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error fetching exchange rate:', error)
    // Return a fallback rate if API fails
    return NextResponse.json({
      rate: FALLBACK_USD_TO_NZD_RATE,
      lastUpdated: new Date().toISOString(),
      isFallback: true
    })
  }
} 