'use client'

import { DollarSign } from 'lucide-react'
import { getLogoUrl } from '@/lib/company-utils'

interface PortfolioHoldingLogoProps {
  symbol: string
  size?: 'sm' | 'md'
}

export function PortfolioHoldingLogo({ symbol, size = 'sm' }: PortfolioHoldingLogoProps) {
  const sizeClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8'

  if (symbol === 'CASH') {
    return (
      <div
        className={`${sizeClass} mr-3 flex shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white`}
      >
        <DollarSign className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={getLogoUrl(symbol)}
      alt={`${symbol} logo`}
      className={`${sizeClass} mr-3 rounded-full`}
      onError={event => {
        event.currentTarget.src = `https://ui-avatars.com/api/?name=${symbol}&background=0a1a16&color=f5f5f5`
      }}
    />
  )
}
