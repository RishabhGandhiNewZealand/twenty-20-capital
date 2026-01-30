"use client"

import { getLogoUrl } from '@/lib/company-utils'
import Image from 'next/image'
import { useState } from 'react'

interface CompanyLogoProps {
    symbol: string
    name: string
    size?: number
    className?: string
}

export function CompanyLogo({ symbol, name, size = 20, className = "" }: CompanyLogoProps) {
    const [error, setError] = useState(false)
    const logoUrl = getLogoUrl(symbol)

    if (error || !logoUrl) {
        return null
    }

    return (
        <span className={`inline-flex items-center align-text-bottom mx-1 ${className}`}>
            <Image
                src={logoUrl}
                alt={`${name} logo`}
                width={size}
                height={size}
                className="object-contain rounded-sm"
                onError={() => setError(true)}
            />
        </span>
    )
}
