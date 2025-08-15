"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"
import { PortfolioHorizontalBarChart } from "@/components/portfolio-horizontal-bar-chart"
import { getLogoUrl } from "@/lib/company-utils"
import { getYearsSinceInception, PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from "@/lib/financial-calculations"
import { formatNumber, formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"

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

// Helper function to create portfolio stats array
function createPortfolioStats(
  portfolioValue: string,
  portfolioCAGR: number,
  sp500CAGR: number,
  subtitle: string = "Current portfolio value"
) {
  return [
    {
      title: "Portfolio Value (NZD)",
      value: portfolioValue,
      subtitle: subtitle,
      icon: DollarSign,
    },
    {
      title: "Portfolio CAGR",
      value: `${formatPercentage(portfolioCAGR)}`,
      description: `Since ${PORTFOLIO_INCEPTION_DATE.getFullYear()} inception`,
      icon: TrendingUp,
    },
    {
      title: "S&P 500 CAGR",
      value: `${formatPercentage(sp500CAGR)}`,
      description: `Benchmark comparison`,
      icon: ChartLine,
    },
  ]
}

function getRawEmail(u: any): string {
  return (
    u?.primaryEmail ||
    u?.email ||
    u?.primaryEmailAddress?.emailAddress ||
    u?.primaryEmailAddress?.email ||
    ""
  )
  .toString()
}

interface Props {
  adminEmail: string
}

export default function MyPortfolioClient({ adminEmail }: Props) {
  const router = useRouter()
  const user = useUser()
  const rawUserEmail = useMemo(() => getRawEmail(user), [user])
  const isAdmin = useMemo(() => rawUserEmail === adminEmail, [rawUserEmail, adminEmail])
  
  const [holdings, setHoldings] = useState<CurrentHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Get user identifier for API calls
  const userIdentifier = user?.id || rawUserEmail

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login")
      return
    }
    
    // If admin, redirect to Rish's portfolio
    if (isAdmin) {
      router.push("/rishs-portfolio")
      return
    }
  }, [user, isAdmin, router])

  useEffect(() => {
    if (!user || isAdmin) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch portfolio data
        const portfolioResponse = await fetch('/api/user-portfolio', {
          headers: {
            'x-user-id': userIdentifier,
            'x-user-email': rawUserEmail,
            'x-is-admin': 'false'
          }
        })

        if (!portfolioResponse.ok) {
          throw new Error('Failed to fetch portfolio data')
        }

        const portfolioData = await portfolioResponse.json()
        setHoldings(portfolioData.holdings || [])
        setSummary(portfolioData.summary || null)

        // Fetch portfolio history
        const historyResponse = await fetch('/api/user-portfolio-history', {
          headers: {
            'x-user-id': userIdentifier,
            'x-user-email': rawUserEmail,
            'x-is-admin': 'false'
          }
        })

        if (!historyResponse.ok) {
          throw new Error('Failed to fetch portfolio history')
        }

        const historyData = await historyResponse.json()
        setPortfolioHistory(historyData.history || [])

        // Fetch exited positions (for now, we'll set empty array as we don't have this API yet)
        setExitedPositions([])

      } catch (error) {
        console.error('Error fetching portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userIdentifier, rawUserEmail, isAdmin])

  // Don't render anything for admin users
  if (isAdmin) {
    return null
  }

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  const portfolioCAGR = summary && summary.totalGainPercent > 0
    ? calculateCAGRFromGainPercent(summary.totalGainPercent, getYearsSinceInception())
    : 0
  
  const sp500CAGR = summary && summary.sp500GainPercent > 0
    ? calculateCAGRFromGainPercent(summary.sp500GainPercent, getYearsSinceInception())
    : 0

  const portfolioStats = createPortfolioStats(
    summary ? formatCurrency(summary.totalValueNZD) : "$0",
    portfolioCAGR,
    sp500CAGR,
    "Your portfolio value"
  )

  const toggleRowExpansion = (symbol: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(symbol)) {
        newSet.delete(symbol)
      } else {
        newSet.add(symbol)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
          <p className="text-gray-600">Track your personal investment performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {portfolioStats.map((stat, index) => (
            <Card key={index} className="border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Portfolio Performance Chart */}
        {portfolioHistory.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <PortfolioChart data={portfolioHistory} />
            </CardContent>
          </Card>
        )}

        {/* Current Holdings */}
        {holdings.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Current Holdings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 sm:px-0 font-medium text-gray-700 text-sm sm:text-base">Company</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base">Shares</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base hidden sm:table-cell">Price</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base">Value (NZD)</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base hidden md:table-cell">Cost (NZD)</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base">Gain (NZD)</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 text-sm sm:text-base hidden lg:table-cell">Gain %</th>
                      <th className="text-right py-3 px-4 sm:px-0 font-medium text-gray-700 text-sm sm:text-base">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <React.Fragment key={holding.symbol}>
                        <tr 
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleRowExpansion(holding.symbol)}
                        >
                          <td className="py-3 px-4 sm:px-0">
                            <div className="flex items-center gap-2">
                              <img
                                src={getLogoUrl(holding.symbol)}
                                alt={holding.symbol}
                                className="w-8 h-8 rounded-full hidden sm:block"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-900 text-sm sm:text-base">{holding.symbol}</div>
                                <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{holding.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-0 text-right text-sm sm:text-base">
                            {formatNumber(holding.shares)}
                          </td>
                          <td className="py-3 px-2 sm:px-0 text-right hidden sm:table-cell text-sm sm:text-base">
                            {holding.currency === 'USD' ? '$' : 'NZ$'}
                            {formatNumber(holding.currentPrice)}
                          </td>
                          <td className="py-3 px-2 sm:px-0 text-right font-medium text-sm sm:text-base">
                            {formatCurrency(holding.currentValueNZD)}
                          </td>
                          <td className="py-3 px-2 sm:px-0 text-right hidden md:table-cell text-gray-600 text-sm sm:text-base">
                            {formatCurrency(holding.costBasisNZD)}
                          </td>
                          <td className={`py-3 px-2 sm:px-0 text-right font-medium text-sm sm:text-base ${
                            holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(holding.gainNZD)}
                          </td>
                          <td className={`py-3 px-2 sm:px-0 text-right hidden lg:table-cell text-sm sm:text-base ${
                            holding.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(holding.gainPercent)}
                          </td>
                          <td className="py-3 px-4 sm:px-0 text-right text-sm sm:text-base">
                            <div className="flex items-center justify-end gap-2">
                              <span>{formatPercentage(holding.allocation)}</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2 hidden xl:block">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(holding.allocation, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded row for mobile */}
                        {expandedRows.has(holding.symbol) && (
                          <tr className="sm:hidden bg-gray-50">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Price:</span>
                                  <span>
                                    {holding.currency === 'USD' ? '$' : 'NZ$'}
                                    {formatNumber(holding.currentPrice)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cost Basis:</span>
                                  <span>{formatCurrency(holding.costBasisNZD)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Gain %:</span>
                                  <span className={holding.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatPercentage(holding.gainPercent)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  {summary && (
                    <tfoot>
                      <tr className="font-bold border-t-2">
                        <td className="py-3 px-4 sm:px-0 text-sm sm:text-base">Total</td>
                        <td className="py-3 px-2 sm:px-0"></td>
                        <td className="py-3 px-2 sm:px-0 hidden sm:table-cell"></td>
                        <td className="py-3 px-2 sm:px-0 text-right text-sm sm:text-base">
                          {formatCurrency(summary.totalValueNZD)}
                        </td>
                        <td className="py-3 px-2 sm:px-0 text-right hidden md:table-cell text-sm sm:text-base">
                          {formatCurrency(summary.totalCostBasisNZD)}
                        </td>
                        <td className={`py-3 px-2 sm:px-0 text-right text-sm sm:text-base ${
                          summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(summary.totalGainNZD)}
                        </td>
                        <td className={`py-3 px-2 sm:px-0 text-right hidden lg:table-cell text-sm sm:text-base ${
                          summary.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(summary.totalGainPercent)}
                        </td>
                        <td className="py-3 px-4 sm:px-0 text-right text-sm sm:text-base">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Allocation Chart */}
        {holdings.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <PortfolioHorizontalBarChart holdings={holdings} />
            </CardContent>
          </Card>
        )}

        {/* Performance Comparison */}
        {summary && (
          <Card className="mb-6 sm:mb-8 border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Performance vs S&P 500</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Portfolio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalValueNZD)}
                    </p>
                    <p className={`text-sm ${summary.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.totalGainPercent >= 0 ? '+' : ''}{formatPercentage(summary.totalGainPercent)} 
                      ({formatCurrency(summary.totalGainNZD)})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">S&P 500 Equivalent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.sp500Value)}
                    </p>
                    <p className={`text-sm ${summary.sp500GainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.sp500GainPercent >= 0 ? '+' : ''}{formatPercentage(summary.sp500GainPercent)} 
                      ({formatCurrency(summary.sp500GainNZD)})
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Outperformance</p>
                  <p className={`text-xl font-bold ${
                    (summary.totalGainPercent - summary.sp500GainPercent) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(summary.totalGainPercent - summary.sp500GainPercent) >= 0 ? '+' : ''}
                    {formatPercentage(summary.totalGainPercent - summary.sp500GainPercent)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current exchange rate: 1 USD = {summary.exchangeRate.toFixed(4)} NZD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exited Positions */}
        {exitedPositions.length > 0 && (
          <Card className="border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Exited Positions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 sm:px-0 font-medium text-gray-700">Company</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700">Exit Date</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700 hidden sm:table-cell">Invested</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700">Proceeds</th>
                      <th className="text-right py-3 px-2 sm:px-0 font-medium text-gray-700">Gain/Loss</th>
                      <th className="text-right py-3 px-4 sm:px-0 font-medium text-gray-700 hidden md:table-cell">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exitedPositions.map((position, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 sm:px-0">
                          <div className="flex items-center gap-2">
                            <img
                              src={getLogoUrl(position.symbol)}
                              alt={position.symbol}
                              className="w-8 h-8 rounded-full hidden sm:block"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div>
                              <div className="font-medium text-gray-900">{position.symbol}</div>
                              <div className="text-sm text-gray-500 hidden sm:block">{position.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-0 text-right text-gray-600">
                          {formatDate(position.exitDate)}
                        </td>
                        <td className="py-3 px-2 sm:px-0 text-right hidden sm:table-cell text-gray-600">
                          {formatCurrency(position.totalInvestedNZD)}
                        </td>
                        <td className="py-3 px-2 sm:px-0 text-right font-medium">
                          {formatCurrency(position.totalProceedsNZD)}
                        </td>
                        <td className={`py-3 px-2 sm:px-0 text-right font-medium ${
                          position.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(position.totalGainNZD)}
                        </td>
                        <td className={`py-3 px-4 sm:px-0 text-right hidden md:table-cell ${
                          position.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(position.totalReturnPercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {holdings.length === 0 && !loading && (
          <Card className="border-blue-100">
            <CardContent className="py-12">
              <div className="text-center">
                <ChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Start adding trades to see your portfolio performance and analytics here.
                </p>
                <button
                  onClick={() => router.push('/trades')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Trades
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}