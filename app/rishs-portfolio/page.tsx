"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"
import { PortfolioHorizontalBarChart } from "@/components/portfolio-horizontal-bar-chart"
import { getLogoUrl } from "@/lib/company-utils"
import { getYearsSinceInception, PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from "@/lib/financial-calculations"
import { formatNumber, formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency, maskShares, maskValue } from "@/lib/anonymization-utils"

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

function createPortfolioStats(
  portfolioValue: string,
  portfolioCAGR: number,
  sp500CAGR: number,
  subtitle: string = "Current portfolio value",
  isAnonymized: boolean = false
) {
  return [
    {
      title: "Portfolio Value (NZD)",
      value: isAnonymized ? "NZ$***" : portfolioValue,
      subtitle: subtitle,
      icon: DollarSign,
    },
    {
      title: "Portfolio Yearly CAGR", 
      value: formatPercentage(isNaN(portfolioCAGR) ? 0 : portfolioCAGR),
      description: "Total Value Returns since inception",
      icon: TrendingUp,
    },
    {
      title: "S&P 500 Yearly CAGR",
      value: formatPercentage(isNaN(sp500CAGR) ? 0 : sp500CAGR),
      description: "S&P 500 Total Value Returns since inception",
      icon: ChartLine,
    },
  ]
}

export default function HomePage() {
  const [holdings, setHoldings] = useState<CurrentHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAnonymized } = useAnonymization()
  const [portfolioStats, setPortfolioStats] = useState(
    createPortfolioStats("Loading...", 0, 0, "Calculating current value", isAnonymized)
  )

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const timestamp = Date.now()
        const [currentResponse, portfolioResponse, historyResponse] = await Promise.all([
          fetch(`/api/portfolio-current?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/portfolio?t=${timestamp}`, { cache: 'no-store' }).catch((error) => {
            console.error('Failed to fetch portfolio data:', error)
            return null
          }),
          fetch(`/api/portfolio-history?t=${timestamp}`, { cache: 'no-store' }).catch((error) => {
            console.error('Failed to fetch portfolio history:', error)
            return null
          })
        ])

        if (!currentResponse.ok) {
          throw new Error('Failed to load portfolio data')
        }
        const currentData = await currentResponse.json()
        
        setHoldings(currentData.holdings)
        setSummary(currentData.summary)

        if (portfolioResponse && portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          setExitedPositions(portfolioData.exitedPositions)
        }

        if (historyResponse && historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (historyData.history && historyData.history.length > 0) {
            const latestHistory = historyData.history[historyData.history.length - 1]
            
            const updatedSummary = {
              ...currentData.summary,
              totalValueNZD: latestHistory.portfolioValue,
              totalCostBasisNZD: latestHistory.costBasis,
              totalGainNZD: latestHistory.portfolioValue - latestHistory.costBasis,
              totalGainPercent: latestHistory.costBasis > 0 ? (((latestHistory.portfolioValue - latestHistory.costBasis) / latestHistory.costBasis * 100)) : 0,
              sp500Value: latestHistory.sp500Value,
              sp500GainNZD: latestHistory.sp500Value - latestHistory.costBasis,
              sp500GainPercent: latestHistory.costBasis > 0 ? (((latestHistory.sp500Value - latestHistory.costBasis) / latestHistory.costBasis * 100)) : 0
            }
            setSummary(updatedSummary)

            const formattedValue = formatCurrency(latestHistory.portfolioValue)

            const yearsSinceInception = getYearsSinceInception()
            const portfolioCAGR = calculateCAGRFromGainPercent(isNaN(updatedSummary.totalGainPercent) ? 0 : updatedSummary.totalGainPercent, yearsSinceInception)
            const sp500CAGR = calculateCAGRFromGainPercent(isNaN(updatedSummary.sp500GainPercent) ? 0 : updatedSummary.sp500GainPercent, yearsSinceInception)

            setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Current portfolio value", isAnonymized))
          }
        } else {
          const { totalValueNZD, totalGainPercent, sp500GainPercent } = currentData.summary
          
          const formattedValue = formatCurrency(totalValueNZD)

          const yearsSinceInception = getYearsSinceInception()
          const portfolioCAGR = calculateCAGRFromGainPercent(isNaN(totalGainPercent) ? 0 : totalGainPercent, yearsSinceInception)
          const sp500CAGR = calculateCAGRFromGainPercent(isNaN(sp500GainPercent) ? 0 : sp500GainPercent, yearsSinceInception)

          setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Current portfolio value", isAnonymized))
        }

      } catch (error) {
        setPortfolioStats(prev => prev.map((stat, index) => 
          index === 0 ? { 
            ...stat, 
            value: "Error",
            subtitle: "Failed to load portfolio data",
            description: undefined 
          } : stat
        ))
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [isAnonymized])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <PortfolioChart 
            portfolioStats={portfolioStats} 
          />
        </div>

        {!loading && (
          <div className="mb-6 sm:mb-8">
            <PortfolioHorizontalBarChart 
              holdings={holdings} 
            />
          </div>
        )}

        <Card className="border-blue-100 mb-6 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No holdings found</div>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shares
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Basis (Per Share)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Value (NZD)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gain/Loss (NZD)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {holdings.map((holding) => (
                        <tr key={holding.symbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={getLogoUrl(holding.symbol)} 
                                alt={holding.symbol}
                                className="h-8 w-8 rounded-full mr-3"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=0a1a16&color=f5f5f5`
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                                <div className="text-sm text-gray-500">{holding.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {maskShares(holding.shares, isAnonymized)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrencyWithDecimals(holding.currentPrice, holding.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrencyWithDecimals(
                              holding.currency === 'NZD' 
                                ? (holding.shares > 0 ? (holding.costBasisNZD / holding.shares) : 0)
                                : (holding.shares > 0 ? (holding.costBasisNZD / holding.shares / (summary?.exchangeRate || 1)) : 0), 
                              holding.currency
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {maskCurrency(holding.currentValueNZD, isAnonymized)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className={holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {maskCurrency(holding.gainNZD, isAnonymized)}
                              <span className="text-xs ml-1">
                                ({(isNaN(holding.gainPercent) ? 0 : holding.gainPercent).toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {summary && (
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                            Total Portfolio
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Value: {maskCurrency(summary.totalValueNZD, isAnonymized)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className={summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {maskCurrency(summary.totalGainNZD, isAnonymized)}
                              <span className="text-xs ml-1">
                                ({(isNaN(summary.totalGainPercent) ? 0 : summary.totalGainPercent).toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                            S&P 500 Benchmark
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Value: {maskCurrency(summary.sp500Value, isAnonymized)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className={summary.sp500GainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {maskCurrency(summary.sp500GainNZD, isAnonymized)}
                              <span className="text-xs ml-1">
                                ({(isNaN(summary.sp500GainPercent) ? 0 : summary.sp500GainPercent).toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <div className="md:hidden space-y-4 px-4">
                  {holdings.map((holding) => (
                    <div key={holding.symbol} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <img 
                            src={getLogoUrl(holding.symbol)} 
                            alt={holding.symbol}
                            className="h-10 w-10 rounded-full mr-3"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=0a1a16&color=f5f5f5`
                            }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{holding.symbol}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{holding.name}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`text-center py-3 mb-3 rounded-lg ${
                        holding.gainNZD >= 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className={`text-2xl font-bold ${
                          holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(isNaN(holding.gainPercent) ? 0 : holding.gainPercent).toFixed(1)}%
                        </div>
                        <div className={`text-sm font-medium ${
                          holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {maskCurrency(holding.gainNZD, isAnonymized)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">Shares</div>
                          <div className="font-medium">{maskShares(holding.shares, isAnonymized)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Price</div>
                          <div className="font-medium">
                            {formatCurrencyWithDecimals(holding.currentPrice, holding.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cost Basis (Per Share)</div>
                          <div className="font-medium text-gray-600">
                            {formatCurrencyWithDecimals(
                              holding.currency === 'NZD' 
                                ? (holding.shares > 0 ? (holding.costBasisNZD / holding.shares) : 0)
                                : (holding.shares > 0 ? (holding.costBasisNZD / holding.shares / (summary?.exchangeRate || 1)) : 0), 
                              holding.currency
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Total Value</div>
                          <div className="font-medium text-gray-900">{maskCurrency(holding.currentValueNZD, isAnonymized)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {summary && (
                    <>
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="font-semibold text-gray-900 mb-3">Total Portfolio</div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-gray-500">Market Value</div>
                            <div className="font-medium text-lg">{maskCurrency(summary.totalValueNZD, isAnonymized)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">S&P 500 Value</div>
                            <div className="font-medium text-lg">{maskCurrency(summary.sp500Value, isAnonymized)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">Total Gain</div>
                            <div className={`font-medium ${summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {maskCurrency(summary.totalGainNZD, isAnonymized)} ({(isNaN(summary.totalGainPercent) ? 0 : summary.totalGainPercent).toFixed(1)}%)
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">S&P 500 Gain</div>
                            <div className={`font-medium ${summary.sp500GainNZD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {maskCurrency(summary.sp500GainNZD, isAnonymized)} ({(isNaN(summary.sp500GainPercent) ? 0 : summary.sp500GainPercent).toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
