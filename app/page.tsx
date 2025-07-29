"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"
import { PortfolioTreemap } from "@/components/portfolio-treemap"
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
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Portfolio Performance Chart with integrated stats */}
        <div className="mb-6 sm:mb-8">
          <PortfolioChart portfolioStats={portfolioStats} />
        </div>

        {/* Calculation Methodology as caption below chart */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-4">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            The portfolio and S&P 500 returns are calculated on a Total Value CAGR basis. This method measures the compound annual growth rate of the total portfolio value, including all capital contributions and withdrawals, from inception to the current date. The CAGR represents the annualized rate of return that would be required to grow the initial investment to its current value over the investment period.
          </p>
        </div>

        {/* Portfolio Treemap */}
        {!loading && holdings.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <PortfolioTreemap holdings={holdings} />
          </div>
        )}

        {/* Portfolio Holdings Table */}
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
                {/* Desktop Table View */}
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
                            {holding.currency === 'NZD' 
                              ? `NZ$${(holding.costBasisNZD / holding.shares).toFixed(2)}`
                              : formatCurrency(holding.costBasisNZD / holding.shares / (summary?.exchangeRate || 1), holding.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(holding.currentValueNZD)}
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
                          <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                            Total Portfolio
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Value: {formatCurrency(summary.totalValueNZD)}
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
                          <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                            S&P 500 Benchmark
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Value: {formatCurrency(summary.sp500Value)}
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

                {/* Mobile Card View */}
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
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=3b82f6&color=fff`
                            }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{holding.symbol}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{holding.name}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Prominent Gain/Loss Display */}
                      <div className={`text-center py-3 mb-3 rounded-lg ${
                        holding.gainNZD >= 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className={`text-2xl font-bold ${
                          holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(1)}%
                        </div>
                        <div className={`text-sm font-medium ${
                          holding.gainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(holding.gainNZD)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">Shares</div>
                          <div className="font-medium">{formatNumber(holding.shares, 2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Price</div>
                          <div className="font-medium">
                            {holding.currency === 'NZD' 
                              ? `NZ$${holding.currentPrice.toFixed(2)}`
                              : formatCurrency(holding.currentPrice, holding.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cost Basis (Per Share)</div>
                          <div className="font-medium text-gray-600">
                            {holding.currency === 'NZD' 
                              ? `NZ$${(holding.costBasisNZD / holding.shares).toFixed(2)}`
                              : formatCurrency(holding.costBasisNZD / holding.shares / (summary?.exchangeRate || 1), holding.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Total Value</div>
                          <div className="font-medium text-gray-900">{formatCurrency(holding.currentValueNZD)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary Cards for Mobile */}
                  {summary && (
                    <>
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="font-semibold text-gray-900 mb-3">Total Portfolio</div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-gray-500">Market Value</div>
                            <div className="font-medium text-lg">{formatCurrency(summary.totalValueNZD)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Cost Basis</div>
                            <div className="font-medium">{formatCurrency(summary.totalCostBasisNZD)}</div>
                          </div>
                        </div>
                        <div className={`text-center py-2 rounded-lg ${
                          summary.totalGainNZD >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="text-gray-600 text-xs mb-1">Total Return</div>
                          <div className={`font-bold text-lg ${
                            summary.totalGainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(summary.totalGainNZD)} ({summary.totalGainPercent >= 0 ? '+' : ''}{summary.totalGainPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <div className="font-semibold text-gray-900 mb-3">S&P 500 Benchmark</div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-gray-600">Market Value</div>
                            <div className="font-medium text-lg">{formatCurrency(summary.sp500Value)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Cost Basis</div>
                            <div className="font-medium">{formatCurrency(summary.totalCostBasisNZD)}</div>
                          </div>
                        </div>
                        <div className={`text-center py-2 rounded-lg ${
                          summary.sp500GainNZD >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="text-gray-600 text-xs mb-1">Total Return</div>
                          <div className={`font-bold text-lg ${
                            summary.sp500GainNZD >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(summary.sp500GainNZD)} ({summary.sp500GainPercent >= 0 ? '+' : ''}{summary.sp500GainPercent.toFixed(1)}%)
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

        {/* Exited Positions */}
        {!loading && exitedPositions.length > 0 && (
          <Card className="border-blue-100">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Exited Positions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Stock</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Entry Date</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Exit Date</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Holding Period</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Invested (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Return (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Profit/Loss (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Profit/Loss (%)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">CAGR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exitedPositions
                      .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
                      .map((position, index) => {
                        // Calculate CAGR for the position
                        const entryDate = new Date(position.entryDate)
                        const exitDate = new Date(position.exitDate)
                        const yearsHeld = (exitDate.getTime() - entryDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                        const cagr = calculateCAGRFromGainPercent(position.profitLossPercentage, yearsHeld)
                        
                        // Calculate holding period in days
                        const totalDays = Math.floor((exitDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000))
                        const holdingPeriod = `${totalDays} days`
                        
                        return (
                      <tr key={position.symbol + position.exitDate} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <img 
                              src={getLogoUrl(position.symbol)} 
                              alt={`${position.symbol} logo`}
                              className="w-8 h-8 rounded-full mr-3"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${position.symbol}&background=3b82f6&color=fff`
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{position.symbol}</div>
                              <div className="text-sm text-gray-500">{position.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{formatDate(position.entryDate)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{formatDate(position.exitDate)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{holdingPeriod}</span>
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
                        <td className="py-3 px-2 text-right">
                          <span className={`font-medium ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(cagr)}
                          </span>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 px-4">
                {exitedPositions
                  .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
                  .map((position) => {
                    // Calculate CAGR for the position
                    const entryDate = new Date(position.entryDate)
                    const exitDate = new Date(position.exitDate)
                    const yearsHeld = (exitDate.getTime() - entryDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                    const cagr = calculateCAGRFromGainPercent(position.profitLossPercentage, yearsHeld)
                    
                    // Calculate holding period in days
                    const totalDays = Math.floor((exitDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000))
                    const holdingPeriod = `${totalDays} days`
                    
                    return (
                  <div key={position.symbol + position.exitDate} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <img 
                          src={getLogoUrl(position.symbol)} 
                          alt={`${position.symbol} logo`}
                          className="w-8 h-8 rounded-full mr-2"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${position.symbol}&background=3b82f6&color=fff`
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{position.symbol}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{position.name}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prominent Profit/Loss Display */}
                    <div className={`text-center py-3 mb-3 rounded-lg ${
                      position.profitLossNZD >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        position.profitLossNZD >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.profitLossPercentage >= 0 ? '+' : ''}{formatNumber(position.profitLossPercentage, 1)}%
                      </div>
                      <div className={`text-sm font-medium ${
                        position.profitLossNZD >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(position.profitLossNZD, 'NZD')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">Entry Date</div>
                        <div className="font-medium">{formatDate(position.entryDate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Exit Date</div>
                        <div className="font-medium">{formatDate(position.exitDate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Holding Period</div>
                        <div className="font-medium">{holdingPeriod}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Invested</div>
                        <div className="font-medium text-gray-600">{formatCurrency(position.totalInvestedNZD, 'NZD')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Return</div>
                        <div className="font-medium text-gray-900">{formatCurrency(position.totalReturnNZD, 'NZD')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">CAGR</div>
                        <div className="font-medium text-gray-600">
                          {formatPercentage(cagr)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
  )
}
