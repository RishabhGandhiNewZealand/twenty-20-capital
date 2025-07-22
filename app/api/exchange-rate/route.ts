import { NextResponse } from 'next/server'

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
    console.error('Error fetching exchange rate:', error)
    // Return a fallback rate if API fails
    return NextResponse.json({
      rate: 1.78, // Approximate fallback rate
      lastUpdated: new Date().toISOString(),
      isFallback: true
    })
  }
} 