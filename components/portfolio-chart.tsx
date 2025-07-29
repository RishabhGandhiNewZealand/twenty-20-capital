"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, TrendingUp, DollarSign } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts"
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"

interface PortfolioHistoryData {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

interface PerformanceData {
  date: string
  portfolioPerformance: number
  sp500Performance: number
}

interface PortfolioStat {
  title: string
  value: string
  subtitle?: string
  description?: string
  icon: any
}

interface PortfolioChartProps {
  portfolioStats?: PortfolioStat[]
  onDateHover?: (date: string | null) => void
}

export function PortfolioChart({ portfolioStats = [], onDateHover }: PortfolioChartProps) {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(false)
  const [hideStats, setHideStats] = useState(false)

  useEffect(() => {
    async function fetchPortfolioHistory() {
      try {
        const response = await fetch('/api/portfolio-history')
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio history')
        }
        const result = await response.json()
        
        if (!result.history || result.history.length === 0) {
          setError('No portfolio history data available')
          return
        }
        
        // Format data for the chart - keep original format for value view
        const formattedData = result.history
        
        // Calculate percentage performance data
        const performanceData = calculatePerformanceData(formattedData)
        
        // Sample data to reduce points for better performance
        const sampledData = sampleData(formattedData, 200)
        const sampledPerformanceData = sampleData(performanceData, 200)
        
        setData(sampledData)
        setPerformanceData(sampledPerformanceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioHistory()
  }, [])

  // Calculate percentage performance relative to cost basis
  function calculatePerformanceData(data: PortfolioHistoryData[]): PerformanceData[] {
    // Find the initial S&P 500 investment amount (should match initial cost basis)
    let sp500CostBasis = 0
    
    // The S&P 500 cost basis grows with the portfolio cost basis
    return data.map((point, index) => {
      // Update S&P 500 cost basis when portfolio cost basis increases
      if (index === 0 || point.costBasis > data[index - 1]?.costBasis) {
        const costBasisIncrease = index === 0 ? point.costBasis : point.costBasis - data[index - 1].costBasis
        sp500CostBasis += costBasisIncrease
      }
      
      const portfolioPerformance = point.costBasis > 0 
        ? ((point.portfolioValue - point.costBasis) / point.costBasis) * 100 
        : 0
      
      // Calculate S&P 500 performance relative to its own cost basis
      const sp500Performance = sp500CostBasis > 0 
        ? ((point.sp500Value - sp500CostBasis) / sp500CostBasis) * 100 
        : 0
      
      return {
        date: point.date,
        portfolioPerformance,
        sp500Performance
      }
    })
  }

  // Sample data to reduce the number of points
  function sampleData<T>(data: T[], maxPoints: number): T[] {
    if (data.length <= maxPoints) return data
    
    const step = Math.ceil(data.length / maxPoints)
    const sampled = []
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }
    
    return sampled
  }

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format percentage for tooltips
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Custom tooltip for value view
  const CustomTooltipValue = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    // Hide stats when tooltip is active
    useEffect(() => {
      setHideStats(active || false)
      // Emit date hover event
      if (onDateHover) {
        onDateHover(active ? label : null)
      }
    }, [active, label])

    if (active && payload && payload.length) {
      const portfolioValue = payload.find((p) => p.dataKey === 'portfolioValue')?.value as number
      const costBasis = payload.find((p) => p.dataKey === 'costBasis')?.value as number
      const sp500Value = payload.find((p) => p.dataKey === 'sp500Value')?.value as number
      const gain = portfolioValue - costBasis
      const gainPercent = costBasis > 0 ? ((gain / costBasis) * 100) : 0
      const sp500Gain = sp500Value - costBasis
      const sp500GainPercent = costBasis > 0 ? ((sp500Gain / costBasis) * 100) : 0

      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {new Date(label).toLocaleDateString('en-NZ', { 
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-blue-600 dark:text-blue-400">Portfolio Value:</span>
              <span className="text-sm font-medium">{formatCurrency(portfolioValue)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-green-600 dark:text-green-400">S&P 500 Value:</span>
              <span className="text-sm font-medium">{formatCurrency(sp500Value)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-red-600 dark:text-red-400">Cost Basis:</span>
              <span className="text-sm font-medium">{formatCurrency(costBasis)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Gain:</span>
                <span className={`text-sm font-medium ${gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(gain)} ({gainPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">S&P 500 Gain:</span>
                <span className={`text-sm font-medium ${sp500Gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(sp500Gain)} ({sp500GainPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for percentage view
  const CustomTooltipPercentage = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    // Hide stats when tooltip is active
    useEffect(() => {
      setHideStats(active || false)
      // Emit date hover event
      if (onDateHover) {
        onDateHover(active ? label : null)
      }
    }, [active, label])

    if (active && payload && payload.length) {
      const portfolioPerformance = payload.find((p) => p.dataKey === 'portfolioPerformance')?.value as number
      const sp500Performance = payload.find((p) => p.dataKey === 'sp500Performance')?.value as number
      const outperformance = portfolioPerformance - sp500Performance

      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {new Date(label).toLocaleDateString('en-NZ', { 
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-blue-600 dark:text-blue-400">Portfolio:</span>
              <span className={`text-sm font-medium ${portfolioPerformance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage(portfolioPerformance)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-green-600 dark:text-green-400">S&P 500:</span>
              <span className={`text-sm font-medium ${sp500Performance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage(sp500Performance)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Outperformance:</span>
                <span className={`text-sm font-medium ${outperformance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(outperformance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="font-medium">Loading portfolio history...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching historical data from Yahoo Finance</p>
              <p className="text-xs text-gray-400 mt-2">This may take a moment on first load</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-blue-100">
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="text-red-600 dark:text-red-400">
            Error loading portfolio history: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-blue-100">
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            No portfolio history data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Value</span>
            </Label>
            <Switch
              id="view-toggle"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
              className="data-[state=checked]:bg-blue-600 scale-75 sm:scale-100"
            />
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Percentage</span>
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[300px] sm:h-[400px] w-full relative">
          {/* Portfolio Stats Overlay - Mobile Responsive */}
          {portfolioStats.length > 0 && !hideStats && (
            <div className="absolute top-1 left-[60px] sm:top-2 sm:left-24 z-10 space-y-1 sm:space-y-1.5">
              {portfolioStats.map((stat) => {
                return (
                  <div key={stat.title} className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm">
                    <div>
                      <p className="text-[8px] sm:text-[10px] text-gray-600 leading-tight">{stat.title}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{stat.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            {showPercentage ? (
              <LineChart
                data={performanceData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-NZ', { 
                      month: 'short',
                      year: '2-digit'
                    })
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  width={40}
                />
                <Tooltip content={<CustomTooltipPercentage />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolioPerformance" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Portfolio Performance"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Performance" 
                  stroke="#10b981"
                  strokeWidth={2}
                  name="S&P 500 Performance"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                {/* Zero line for reference */}
                <Line 
                  type="monotone" 
                  dataKey={() => 0} 
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Break Even"
                  dot={false}
                  legendType="none"
                />
              </LineChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-NZ', { 
                      month: 'short',
                      year: '2-digit'
                    })
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip content={<CustomTooltipValue />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolioValue" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Portfolio Value"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Value" 
                  stroke="#10b981"
                  strokeWidth={2}
                  name="S&P 500 Value"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="costBasis" 
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Cost Basis"
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}