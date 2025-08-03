"use client"

import React, { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { ExitedPosition } from "@/types/portfolio"
import { getLogoUrl } from "@/lib/company-utils"
import { getYearsSinceInception, PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from "@/lib/financial-calculations"

// Lazy load heavy chart components
const PortfolioChart = lazy(() => 
  import("@/components/portfolio-chart").then(module => ({ default: module.PortfolioChart }))
)
const PortfolioHorizontalBarChart = lazy(() => 
  import("@/components/portfolio-horizontal-bar-chart").then(module => ({ default: module.PortfolioHorizontalBarChart }))
)

// Loading component for charts
const ChartLoadingFallback = () => (
  <Card>
    <CardContent className="h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-sm text-gray-500">Loading chart...</p>
      </div>
    </CardContent>
  </Card>
)

interface CurrentHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  currentValueNZD: number
  costBasisNZD: number
  gainNZD: number
  gainPercent: number
  allocation: number
  currency: string
}

interface PortfolioSummary {
  totalValueNZD: number
  totalCostBasisNZD: number
  totalGainNZD: number
  totalGainPercent: number
  sp500Value: number
  sp500GainNZD: number
  sp500GainPercent: number
  exchangeRate: number
}

// Memoized holding row component
const HoldingRow = React.memo(({ holding, getLogoUrl, formatCurrency, formatNumber }: {
  holding: CurrentHolding
  getLogoUrl: (symbol: string) => string
  formatCurrency: (value: number | undefined, currency?: string) => string
  formatNumber: (value: number, decimals?: number) => string
}) => {
  return (
    <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <img 
            src={getLogoUrl(holding.symbol)} 
            alt={holding.symbol}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=0D8ABC&color=fff&size=32`
            }}
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{holding.symbol}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{holding.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatNumber(holding.shares, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatCurrency(holding.currentPrice, holding.currency)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatCurrency(holding.currentValueNZD)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatCurrency(holding.costBasisNZD)}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
        holding.gainNZD >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {formatCurrency(holding.gainNZD)}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
        holding.gainPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {holding.gainPercent >= 0 ? '+' : ''}{formatNumber(holding.gainPercent)}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatNumber(holding.allocation)}%
      </td>
    </tr>
  )
})

HoldingRow.displayName = 'HoldingRow'

export default function HomePage() {
  const [holdings, setHoldings] = useState<CurrentHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [portfolioStats, setPortfolioStats] = useState([
    {
      title: "Portfolio Value (NZD)",
      value: "Loading...",
      subtitle: "Calculating current value",
      icon: DollarSign,
    },
    {
      title: "Portfolio Yearly CAGR", 
      value: "Loading...",
      description: "Total Value Returns since inception",
      icon: TrendingUp,
    },
    {
      title: "S&P 500 Yearly CAGR",
      value: "Loading...",
      description: "S&P 500 Total Value Returns since inception",
      icon: ChartLine,
    },
  ])

  // Memoized formatters
  const formatCurrency = useCallback((value: number | undefined, currency: string = 'NZD') => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }, [])

  const formatNumber = useCallback((value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-NZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }, [])

  // Fetch portfolio data with optimized error handling
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchPortfolioData = async () => {
      try {
        // Parallel fetch all data
        const [currentResponse, portfolioResponse, historyResponse] = await Promise.all([
          fetch('/api/portfolio-current', { signal: controller.signal }),
          fetch('/api/portfolio', { signal: controller.signal }),
          fetch('/api/portfolio-history', { 
            signal: controller.signal,
            headers: {
              'Cache-Control': 'max-age=300'
            }
          })
        ])

        if (!isMounted) return

        if (!currentResponse.ok) {
          throw new Error('Failed to load portfolio data')
        }

        const currentData = await currentResponse.json()
        
        if (!isMounted) return
        
        setHoldings(currentData.holdings)
        setSummary(currentData.summary)

        // Process portfolio response
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          if (isMounted) {
            setExitedPositions(portfolioData.exitedPositions)
          }
        }

        // Process history response for accurate values
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (!isMounted) return
          
          if (historyData.history && historyData.history.length > 0) {
            const latestHistory = historyData.history[historyData.history.length - 1]
            
            // Update summary with values from portfolio history (source of truth)
            const updatedSummary = {
              ...currentData.summary,
              totalValueNZD: latestHistory.portfolioValue,
              totalCostBasisNZD: latestHistory.costBasis,
              totalGainNZD: latestHistory.portfolioValue - latestHistory.costBasis,
              totalGainPercent: ((latestHistory.portfolioValue - latestHistory.costBasis) / latestHistory.costBasis * 100),
              sp500Value: latestHistory.sp500Value,
              sp500GainNZD: latestHistory.sp500Value - latestHistory.costBasis,
              sp500GainPercent: ((latestHistory.sp500Value - latestHistory.costBasis) / latestHistory.costBasis * 100)
            }
            setSummary(updatedSummary)

            // Update portfolio stats with the accurate data
            const formattedValue = formatCurrency(latestHistory.portfolioValue)

            // Calculate CAGR from the gain percentages
            const yearsSinceInception = getYearsSinceInception()
            const portfolioCAGR = calculateCAGRFromGainPercent(updatedSummary.totalGainPercent, yearsSinceInception)
            const sp500CAGR = calculateCAGRFromGainPercent(updatedSummary.sp500GainPercent, yearsSinceInception)

            setPortfolioStats([
              {
                title: "Portfolio Value (NZD)",
                value: formattedValue,
                subtitle: "Current portfolio value",
                icon: DollarSign,
              },
              {
                title: "Portfolio Yearly CAGR", 
                value: formatPercentage(portfolioCAGR),
                description: "Total Value Returns since inception",
                icon: TrendingUp,
              },
              {
                title: "S&P 500 Yearly CAGR",
                value: formatPercentage(sp500CAGR),
                description: "S&P 500 Total Value Returns since inception",
                icon: ChartLine,
              },
            ])
          }
        } else {
          // Fallback to using data from portfolio-current if history fails
          const { totalValueNZD, totalGainPercent, sp500GainPercent } = currentData.summary
          
          const formattedValue = formatCurrency(totalValueNZD)

          // Calculate CAGR from the gain percentages
          const yearsSinceInception = getYearsSinceInception()
          const portfolioCAGR = calculateCAGRFromGainPercent(totalGainPercent, yearsSinceInception)
          const sp500CAGR = calculateCAGRFromGainPercent(sp500GainPercent, yearsSinceInception)

          setPortfolioStats([
            {
              title: "Portfolio Value (NZD)",
              value: formattedValue,
              subtitle: "Current portfolio value",
              icon: DollarSign,
            },
            {
              title: "Portfolio Yearly CAGR", 
              value: formatPercentage(portfolioCAGR),
              description: "Total Value Returns since inception",
              icon: TrendingUp,
            },
            {
              title: "S&P 500 Yearly CAGR",
              value: formatPercentage(sp500CAGR),
              description: "S&P 500 Total Value Returns since inception",
              icon: ChartLine,
            },
          ])
        }

      } catch (error: any) {
        if (!isMounted) return
        if (error.name !== 'AbortError') {
          // Update portfolio stats to show error
          setPortfolioStats(prev => prev.map((stat, index) => 
            index === 0 ? { 
              ...stat, 
              value: "Error",
              subtitle: "Failed to load portfolio data",
              description: undefined 
            } : stat
          ))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPortfolioData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [formatCurrency])

  // Memoized calculations
  const portfolioMetrics = useMemo(() => {
    if (!summary) return null

    const yearsSinceInception = getYearsSinceInception()
    const portfolioCAGR = calculateCAGRFromGainPercent(summary.totalGainPercent, yearsSinceInception)
    const sp500CAGR = calculateCAGRFromGainPercent(summary.sp500GainPercent, yearsSinceInception)
    const cagrOutperformance = portfolioCAGR - sp500CAGR

    return {
      yearsSinceInception,
      portfolioCAGR,
      sp500CAGR,
      cagrOutperformance,
      totalOutperformance: summary.totalGainPercent - summary.sp500GainPercent
    }
  }, [summary])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Portfolio Chart with Stats */}
      <Suspense fallback={<ChartLoadingFallback />}>
        <PortfolioChart portfolioStats={portfolioStats} />
      </Suspense>

      {/* Portfolio Composition Timeline */}
      <Suspense fallback={<ChartLoadingFallback />}>
        <PortfolioHorizontalBarChart holdings={holdings} />
      </Suspense>

      {/* Summary Cards */}
      {summary && portfolioMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value (NZD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalValueNZD)}</p>
              <p className={`text-sm ${summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalGainNZD >= 0 ? '+' : ''}{formatCurrency(summary.totalGainNZD)} ({formatNumber(summary.totalGainPercent)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">S&P 500 Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(summary.sp500Value)}</p>
              <p className={`text-sm ${summary.sp500GainNZD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.sp500GainNZD >= 0 ? '+' : ''}{formatCurrency(summary.sp500GainNZD)} ({formatNumber(summary.sp500GainPercent)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Outperformance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${portfolioMetrics.totalOutperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioMetrics.totalOutperformance >= 0 ? '+' : ''}{formatNumber(portfolioMetrics.totalOutperformance)}%
              </p>
              <p className="text-sm text-gray-600">vs S&P 500</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">USD/NZD Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(summary.exchangeRate, 4)}</p>
              <p className="text-sm text-gray-600">Current exchange rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Shares</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Value (NZD)</th>
                  <th className="px-6 py-3">Cost Basis</th>
                  <th className="px-6 py-3">Gain/Loss</th>
                  <th className="px-6 py-3">Return</th>
                  <th className="px-6 py-3">Allocation</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {holdings.map((holding) => (
                  <HoldingRow
                    key={holding.symbol}
                    holding={holding}
                    getLogoUrl={getLogoUrl}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Exited Positions */}
      {exitedPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exited Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Entry Date</th>
                    <th className="px-6 py-3">Exit Date</th>
                    <th className="px-6 py-3">Holding Period</th>
                    <th className="px-6 py-3">Gain/Loss (NZD)</th>
                    <th className="px-6 py-3">Return</th>
                    <th className="px-6 py-3">CAGR</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {exitedPositions.map((position) => (
                    <tr key={`${position.symbol}-${position.entryDate}-${position.exitDate}`} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getLogoUrl(position.symbol)} 
                            alt={position.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://ui-avatars.com/api/?name=${position.symbol}&background=0D8ABC&color=fff&size=32`
                            }}
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{position.symbol}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{position.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(position.entryDate).toLocaleDateString('en-NZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(position.exitDate).toLocaleDateString('en-NZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {position.holdingPeriodYears.toFixed(1)} years
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        position.totalGainNZD >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(position.totalGainNZD)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        position.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {position.totalReturn >= 0 ? '+' : ''}{formatNumber(position.totalReturn)}%
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        position.cagr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {position.cagr >= 0 ? '+' : ''}{formatNumber(position.cagr)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Statistics */}
      {summary && portfolioMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Portfolio CAGR:</dt>
                    <dd className={`font-medium ${portfolioMetrics.portfolioCAGR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(portfolioMetrics.portfolioCAGR)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">S&P 500 CAGR:</dt>
                    <dd className={`font-medium ${portfolioMetrics.sp500CAGR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(portfolioMetrics.sp500CAGR)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">CAGR Outperformance:</dt>
                    <dd className={`font-medium ${portfolioMetrics.cagrOutperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioMetrics.cagrOutperformance >= 0 ? '+' : ''}{formatNumber(portfolioMetrics.cagrOutperformance)}%
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Portfolio Details</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Inception Date:</dt>
                    <dd className="font-medium">{PORTFOLIO_INCEPTION_DATE.toLocaleDateString('en-NZ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Years Since Inception:</dt>
                    <dd className="font-medium">{portfolioMetrics.yearsSinceInception.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Number of Holdings:</dt>
                    <dd className="font-medium">{holdings.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
