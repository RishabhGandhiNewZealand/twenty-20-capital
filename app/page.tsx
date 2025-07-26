"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"
import { getLogoUrl } from "@/lib/company-utils"
import { getYearsSinceInception, PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from "@/lib/financial-calculations"

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



  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Fetch current portfolio data from the new endpoint
        const currentResponse = await fetch('/api/portfolio-current')
        if (!currentResponse.ok) {
          throw new Error('Failed to load portfolio data')
        }
        const currentData = await currentResponse.json()
        
        setHoldings(currentData.holdings)
        setSummary(currentData.summary)

        // Fetch exited positions from the old endpoint
        const portfolioResponse = await fetch('/api/portfolio')
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          setExitedPositions(portfolioData.exitedPositions)
        }

        // Fetch portfolio history to get the latest accurate values
        const historyResponse = await fetch('/api/portfolio-history')
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
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

      } catch (error) {
        // Update portfolio stats to show error
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
  }, [])

  const formatCurrency = (value: number | undefined, currency: string = 'NZD') => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-NZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Performance Chart with integrated stats */}
        <div className="mb-8">
          <PortfolioChart portfolioStats={portfolioStats} />
        </div>

        {/* Calculation Methodology as caption below chart */}
        <div className="mb-8 px-4">
          <p className="text-sm text-gray-600 text-center">
            The portfolio and S&P 500 returns are calculated on a Total Value CAGR basis. This method measures the compound annual growth rate of the total portfolio value, including all capital contributions and withdrawals, from inception to the current date. The CAGR represents the annualized rate of return that would be required to grow the initial investment to its current value over the investment period.
          </p>
        </div>

        {/* Portfolio Holdings Table */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No holdings found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        Market Value (NZD)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Basis (NZD)
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
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=3b82f6&color=fff`
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                              <div className="text-sm text-gray-500">{holding.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(holding.shares, 2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {holding.currency === 'NZD' 
                            ? `NZ$${holding.currentPrice.toFixed(2)}`
                            : formatCurrency(holding.currentPrice, holding.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(holding.currentValueNZD)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(holding.costBasisNZD)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(holding.gainNZD)}
                            <span className="text-xs ml-1">
                              ({holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {summary && (
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                          Total Portfolio
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(summary.totalValueNZD)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(summary.totalCostBasisNZD)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className={summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(summary.totalGainNZD)}
                            <span className="text-xs ml-1">
                              ({summary.totalGainPercent >= 0 ? '+' : ''}{summary.totalGainPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                          S&P 500 Benchmark
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(summary.sp500Value)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(summary.totalCostBasisNZD)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className={summary.sp500GainNZD >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(summary.sp500GainNZD)}
                            <span className="text-xs ml-1">
                              ({summary.sp500GainPercent >= 0 ? '+' : ''}{summary.sp500GainPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exited Positions */}
        {!loading && exitedPositions.length > 0 && (
          <Card className="border-blue-100 mt-8">
            <CardHeader>
              <CardTitle className="text-gray-900">Exited Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Symbol</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Company</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Entry Date</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Exit Date</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Invested (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Return (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Profit/Loss (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Profit/Loss (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exitedPositions
                      .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
                      .map((position, index) => (
                      <tr key={position.symbol + position.exitDate} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <img 
                              src={getLogoUrl(position.symbol)} 
                              alt={`${position.symbol} logo`}
                              className="w-6 h-6 rounded mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <span className="font-bold text-gray-900">{position.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-gray-700">{position.name}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{formatDate(position.entryDate)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{formatDate(position.exitDate)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-gray-700">{formatCurrency(position.totalInvestedNZD, 'NZD')}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-gray-700">{formatCurrency(position.totalReturnNZD, 'NZD')}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-medium ${position.profitLossNZD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(position.profitLossNZD, 'NZD')}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-medium ${position.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.profitLossPercentage >= 0 ? '+' : ''}{formatNumber(position.profitLossPercentage, 1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
