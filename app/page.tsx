"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Calendar, BarChart3, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PortfolioHolding, ExitedPosition } from "@/types/portfolio"
import { StockPrice, StockPriceError } from "@/types/stock"
import { calculatePortfolioAllocations } from "@/lib/portfolio"
import { PortfolioChart } from "@/components/portfolio-chart"

interface EnhancedPortfolioHolding extends PortfolioHolding {
  currentPrice?: number
  currentValueNZD?: number
  loading?: boolean
  error?: string
}

export default function HomePage() {
  const [holdings, setHoldings] = useState<EnhancedPortfolioHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [exchangeRate, setExchangeRate] = useState<number>(1.78)
  const [portfolioStats, setPortfolioStats] = useState([
    {
      title: "Portfolio Value",
      value: "Loading...",
      subtitle: "Calculating current value",
      icon: Target,
    },
    {
      title: "Portfolio Yearly CAGR", 
      value: "+22.3%",
      description: "Money-weighted return since inception",
      icon: BarChart3,
    },
    {
      title: "S&P 500 Yearly CAGR",
      value: "+19.8%",
      description: "S&P 500 money-weighted return since inception",
      icon: Calendar,
    },
  ])

  // Function to get company logo URL
  const getLogoUrl = (symbol: string) => {
    return `https://logo.clearbit.com/${getCompanyDomain(symbol)}`
  }

  const getCompanyDomain = (symbol: string) => {
    const domains: { [key: string]: string } = {
      'UBER': 'uber.com',
      'GOOGL': 'google.com',
      'AMZN': 'amazon.com',
      'META': 'meta.com',
      'NFLX': 'netflix.com',
      'MA': 'mastercard.com',
      'ASML': 'asml.com',
      'SPGI': 'spglobal.com',
      'MFT': 'mainfreight.com',
      'CRM': 'salesforce.com',
      'UNH': 'unitedhealthgroup.com',
      'ANET': 'arista.com',
      'CP': 'cpr.ca',
      'MSCI': 'msci.com'
    }
    return domains[symbol] || `${symbol.toLowerCase()}.com`
  }

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Fetch portfolio holdings from API
        const portfolioResponse = await fetch('/api/portfolio')
        if (!portfolioResponse.ok) {
          throw new Error('Failed to load portfolio data from CSV')
        }
        const portfolioData = await portfolioResponse.json()
        const baseHoldings: PortfolioHolding[] = portfolioData.holdings
        setExitedPositions(portfolioData.exitedPositions)

        // Fetch exchange rate
        const exchangeResponse = await fetch('/api/exchange-rate')
        let currentExchangeRate = 1.78
        if (exchangeResponse.ok) {
          const exchangeData = await exchangeResponse.json()
          currentExchangeRate = exchangeData.rate
          setExchangeRate(currentExchangeRate)
        }

        // Fetch current prices for all holdings
        const updatedHoldings = await Promise.all(
          baseHoldings.map(async (holding) => {
            const enhancedHolding: EnhancedPortfolioHolding = {
              ...holding,
              loading: true
            }

            try {
              if (holding.instrumentCurrency === 'USD') {
                const response = await fetch(`/api/stock-price/${holding.symbol}`)
                if (response.ok) {
                  const stockData: StockPrice = await response.json()
                  const currentValueUSD = stockData.currentPrice * holding.totalShares
                  const currentValueNZD = currentValueUSD * currentExchangeRate
                  
                  return {
                    ...enhancedHolding,
                    currentPrice: stockData.currentPrice,
                    currentValueNZD,
                    loading: false,
                    error: undefined
                  }
                } else {
                  return {
                    ...enhancedHolding,
                    loading: false,
                    error: 'Price unavailable'
                  }
                }
              } else {
                // For NZD stocks (MFT), we need NZX data - for now use fallback
                const estimatedCurrentValueNZD = holding.totalShares * holding.avgPriceNZD * 1.1 // Rough estimate
                return {
                  ...enhancedHolding,
                  currentValueNZD: estimatedCurrentValueNZD,
                  loading: false,
                  error: undefined
                }
              }
            } catch (error) {
              return {
                ...enhancedHolding,
                loading: false,
                error: 'Failed to fetch price'
              }
            }
          })
        )

        // Calculate allocations
        const holdingsWithAllocations = calculatePortfolioAllocations(updatedHoldings)
        setHoldings(holdingsWithAllocations)

        // Update portfolio stats
        const totalValue = holdingsWithAllocations.reduce((sum, h) => sum + (h.currentValueNZD || 0), 0)
        const formattedValue = new Intl.NumberFormat('en-NZ', {
          style: 'currency',
          currency: 'NZD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(totalValue)

        setPortfolioStats(prev => prev.map((stat, index) => 
          index === 0 ? { 
            ...stat, 
            value: formattedValue, 
            subtitle: "Current portfolio value",
            description: undefined 
          } : stat
        ))

      } catch (error) {
        console.error('Error fetching portfolio data:', error)
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Since inception: October 2023</p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {portfolioStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-700 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Portfolio Performance Chart */}
        <div className="mb-8">
          <PortfolioChart />
        </div>

        {/* Portfolio Holdings Table */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 && portfolioStats[0].value === "Error" ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-lg font-medium mb-2">Failed to Load Portfolio Data</div>
                <div className="text-gray-600">Unable to read portfolio data from CSV file. Please check if the file exists and is accessible.</div>
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading portfolio data...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Symbol</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Company</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Position Started</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Shares</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Avg Price (NZD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Avg Price (USD)</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Allocation</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Current Value (NZD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings
                      .filter(holding => holding.totalShares > 0.01)
                      .sort((a, b) => (b.allocation || 0) - (a.allocation || 0))
                      .map((holding, index) => (
                      <tr key={holding.symbol} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <img 
                              src={getLogoUrl(holding.symbol)} 
                              alt={`${holding.symbol} logo`}
                              className="w-6 h-6 rounded mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <span className="font-bold text-gray-900">{holding.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-gray-700">{holding.name}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-gray-600">{formatDate(holding.firstPurchaseDate)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-gray-700">{formatNumber(holding.totalShares, 0)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-gray-700">{formatCurrency(holding.avgPriceNZD, 'NZD')}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {holding.avgPriceUSD ? (
                            <span className="text-gray-700">{formatCurrency(holding.avgPriceUSD, 'USD')}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {holding.loading ? (
                            <div className="flex items-center justify-end">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900">{formatNumber(holding.allocation || 0, 1)}%</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {holding.loading ? (
                            <div className="flex items-center justify-end">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          ) : holding.error ? (
                            <span className="text-red-500 text-sm">Error</span>
                          ) : (
                            <span className="font-medium text-gray-900">{formatCurrency(holding.currentValueNZD, 'NZD')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exited Positions Table */}
        {portfolioStats[0].value !== "Error" && exitedPositions.length > 0 && (
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
