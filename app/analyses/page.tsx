'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StockPrice, StockPriceError } from '@/types/stock'

interface Analysis {
  company: string
  symbol: string
  sector: string
  intrinsicValue: string
  href: string
  lastUpdated: string
  summary: string
  logo: string
  logoColor: string
  currentPrice?: number
  currency?: string
  loading?: boolean
  error?: string
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([
    {
      company: 'Uber Technologies',
      symbol: 'UBER',
      sector: 'Transportation & Delivery',
      intrinsicValue: '$110',
      href: '/analyses/uber',
      lastUpdated: 'December 4, 2024',
      summary:
        'Uber exhibits strong fundamental attributes with a significant competitive advantage built on 15+ years of data and network effects. The company has achieved critical scale leading to expanding profit margins, generating consistent cash flows despite facing challenges from autonomous vehicles and regulatory pressures.',
      logo: 'UBER',
      logoColor: 'bg-black',
      loading: true,
    },
    {
      company: 'ASML Holding',
      symbol: 'ASML',
      sector: 'Technology Hardware',
      intrinsicValue: '$900',
      href: '/analyses/asml',
      lastUpdated: 'March 15, 2025',
      summary:
        "ASML maintains a near-monopoly in EUV lithography with 90%+ market share, making it essential for advanced semiconductor manufacturing. The company's technological lead and robust demand from AI, automotive, and cloud computing positions it favorably for sustained growth despite cyclical industry pressures.",
      logo: 'ASML',
      logoColor: 'bg-blue-600',
      loading: true,
    },
  ])

  useEffect(() => {
    const fetchStockPrices = async () => {
      const updatedAnalyses = await Promise.all(
        analyses.map(async analysis => {
          try {
            const response = await fetch(`/api/stock-price/${analysis.symbol}`)

            if (response.ok) {
              const stockData: StockPrice = await response.json()
              return {
                ...analysis,
                currentPrice: stockData.currentPrice,
                currency: stockData.currency,
                loading: false,
                error: undefined,
              }
            } else {
              const errorData: StockPriceError = await response.json()
              return {
                ...analysis,
                loading: false,
                error: errorData.error,
              }
            }
          } catch (error) {
            return {
              ...analysis,
              loading: false,
              error: 'Failed to fetch stock price',
            }
          }
        })
      )

      setAnalyses(updatedAnalyses)
    }

    fetchStockPrices()
  }, [])

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analyses & Essays</h1>
          <p className="text-sm sm:text-base text-gray-600">
            In-depth fundamental analysis and long-form investment thinking
          </p>
        </div>

        <Link href="/analyses/anthropic" className="block mb-4 sm:mb-6">
          <Card className="group h-full cursor-pointer overflow-hidden border-violet-200 bg-gradient-to-br from-white via-white to-violet-50 transition-all hover:border-violet-300 hover:shadow-lg dark:border-violet-900 dark:from-card dark:via-card dark:to-violet-950/30 dark:hover:border-violet-700">
            <CardContent className="p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-700 text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                        Strategic Essay
                      </p>
                      <p className="text-sm text-gray-500">Anthropic</p>
                    </div>
                  </div>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 transition-colors group-hover:text-violet-800 sm:text-2xl">
                    The $2 Trillion Hedge
                  </h2>
                  <p className="line-clamp-3 text-sm leading-6 text-gray-600 sm:text-base">
                    When Anthropic eventually walks into the public markets, the number everyone
                    will talk about is the valuation. If the rumors are right, that number could be
                    close to $2 trillion, placing the company among the largest market debuts ever.
                  </p>
                </div>
                <div className="flex shrink-0 items-center text-sm text-gray-500 sm:pt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  August 21, 2026
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {analyses.map(analysis => (
            <Link key={analysis.href} href={analysis.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${analysis.logoColor} text-white flex items-center justify-center font-bold text-sm sm:text-base`}
                      >
                        {analysis.logo}
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg text-gray-900">
                          {analysis.company}
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-500">
                          <span>{analysis.symbol}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{analysis.sector}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Intrinsic Value</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">
                        {analysis.intrinsicValue}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                    {analysis.summary}
                  </p>

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {analysis.lastUpdated}
                    </div>
                    <div className="text-right">
                      {analysis.loading ? (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Loading price...</span>
                        </div>
                      ) : analysis.error ? (
                        <span className="text-xs sm:text-sm text-red-600">{analysis.error}</span>
                      ) : analysis.currentPrice ? (
                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-base sm:text-lg font-semibold">
                            {analysis.currency === 'USD'
                              ? '$'
                              : analysis.currency === 'EUR'
                                ? '€'
                                : '$'}
                            {analysis.currentPrice.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs sm:text-sm ${
                              analysis.currentPrice <
                              parseFloat(analysis.intrinsicValue.replace(/[$€,]/g, ''))
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {(
                              (parseFloat(analysis.intrinsicValue.replace(/[$€,]/g, '')) /
                                analysis.currentPrice -
                                1) *
                              100
                            ).toFixed(1)}
                            %{' '}
                            {analysis.currentPrice <
                            parseFloat(analysis.intrinsicValue.replace(/[$€,]/g, ''))
                              ? 'undervalued'
                              : 'premium'}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
