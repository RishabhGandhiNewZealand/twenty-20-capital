"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"
import { PortfolioHorizontalBarChart } from "@/components/portfolio-horizontal-bar-chart"
import { getLogoUrl } from "@/lib/company-utils"
import { getYearsSinceInception, PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from "@/lib/financial-calculations"
import { formatNumber, formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"

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

interface DailyPortfolioData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
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
  const [dailyData, setDailyData] = useState<DailyPortfolioData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch portfolio data
  useEffect(() => {
    if (!user || isAdmin) return

    const fetchPortfolioData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch current portfolio data
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
        setExitedPositions(portfolioData.exitedPositions || [])
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
        setDailyData(historyData.history || [])

      } catch (err) {
        console.error('Error fetching portfolio:', err)
        setError(err instanceof Error ? err.message : 'Failed to load portfolio')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
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

  // Calculate portfolio stats
  const portfolioCAGR = summary && summary.totalGainPercent > 0
    ? calculateCAGRFromGainPercent(summary.totalGainPercent, getYearsSinceInception())
    : 0
  
  const sp500CAGR = summary && summary.sp500GainPercent > 0
    ? calculateCAGRFromGainPercent(summary.sp500GainPercent, getYearsSinceInception())
    : 0

  const portfolioStats = [
    {
      title: "Portfolio Value (NZD)",
      value: summary ? formatCurrency(summary.totalValueNZD) : "—",
      subtitle: "Current portfolio value",
      icon: DollarSign,
    },
    {
      title: "Total Return",
      value: summary ? formatPercentage(summary.totalGainPercent) : "—",
      description: summary ? `${formatCurrency(summary.totalGainNZD)} gain` : "—",
      icon: TrendingUp,
    },
    {
      title: "CAGR",
      value: formatPercentage(portfolioCAGR),
      description: `vs S&P 500: ${formatPercentage(sp500CAGR)}`,
      icon: ChartLine,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
          <p className="text-gray-600">Track your personal investment portfolio</p>
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

        {/* Portfolio Chart */}
        {dailyData.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <PortfolioChart data={dailyData} />
            </CardContent>
          </Card>
        )}

        {/* Current Holdings */}
        {holdings.length > 0 && (
          <>
            <Card className="mb-6 sm:mb-8 border-blue-100">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-gray-900 text-lg sm:text-xl">Current Holdings</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-gray-700">Company</th>
                        <th className="pb-2 font-medium text-gray-700 text-right">Shares</th>
                        <th className="pb-2 font-medium text-gray-700 text-right hidden sm:table-cell">Price</th>
                        <th className="pb-2 font-medium text-gray-700 text-right">Value</th>
                        <th className="pb-2 font-medium text-gray-700 text-right hidden md:table-cell">Cost</th>
                        <th className="pb-2 font-medium text-gray-700 text-right">Gain</th>
                        <th className="pb-2 font-medium text-gray-700 text-right hidden lg:table-cell">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.symbol} className="border-b hover:bg-gray-50">
                          <td className="py-3">
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
                                <div className="font-medium text-gray-900">{holding.symbol}</div>
                                <div className="text-sm text-gray-500 hidden sm:block">{holding.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right">{formatNumber(holding.shares)}</td>
                          <td className="py-3 text-right hidden sm:table-cell">
                            {holding.currency === 'USD' ? '$' : 'NZ$'}
                            {formatNumber(holding.currentPrice)}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrency(holding.currentValueNZD)}
                          </td>
                          <td className="py-3 text-right hidden md:table-cell text-gray-600">
                            {formatCurrency(holding.costBasisNZD)}
                          </td>
                          <td className={`py-3 text-right font-medium ${
                            holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(holding.gainNZD)}
                          </td>
                          <td className={`py-3 text-right hidden lg:table-cell ${
                            holding.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(holding.gainPercent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Allocation Chart */}
            <Card className="mb-6 sm:mb-8 border-blue-100">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <PortfolioHorizontalBarChart holdings={holdings} />
              </CardContent>
            </Card>
          </>
        )}

        {/* Exited Positions */}
        {exitedPositions.length > 0 && (
          <Card className="border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Exited Positions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-gray-700">Company</th>
                      <th className="pb-2 font-medium text-gray-700 text-right">Exit Date</th>
                      <th className="pb-2 font-medium text-gray-700 text-right hidden sm:table-cell">Invested</th>
                      <th className="pb-2 font-medium text-gray-700 text-right">Proceeds</th>
                      <th className="pb-2 font-medium text-gray-700 text-right">Gain/Loss</th>
                      <th className="pb-2 font-medium text-gray-700 text-right hidden md:table-cell">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exitedPositions.map((position, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3">
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
                        <td className="py-3 text-right text-gray-600">
                          {formatDate(position.exitDate)}
                        </td>
                        <td className="py-3 text-right hidden sm:table-cell text-gray-600">
                          {formatCurrency(position.totalInvestedNZD)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(position.totalProceedsNZD)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          position.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(position.totalGainNZD)}
                        </td>
                        <td className={`py-3 text-right hidden md:table-cell ${
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
        {holdings.length === 0 && exitedPositions.length === 0 && !loading && (
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