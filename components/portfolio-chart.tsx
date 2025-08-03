"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
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
}

// Memoized component to prevent unnecessary re-renders
export const PortfolioChart = React.memo(({ portfolioStats = [] }: PortfolioChartProps) => {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(false)
  const [hideStats, setHideStats] = useState(false)

  // Optimized data sampling function with memoization
  const sampleData = useCallback(<T extends any>(data: T[], maxPoints: number): T[] => {
    if (data.length <= maxPoints) return data
    
    // Use a more intelligent sampling algorithm that preserves important data points
    const step = Math.floor(data.length / maxPoints)
    const sampled: T[] = []
    
    // Always include first point
    sampled.push(data[0])
    
    // Sample middle points
    for (let i = step; i < data.length - step; i += step) {
      sampled.push(data[i])
    }
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }
    
    return sampled
  }, [])

  // Calculate percentage performance relative to cost basis - memoized
  const calculatePerformanceData = useCallback((data: PortfolioHistoryData[]): PerformanceData[] => {
    let sp500CostBasis = 0
    
    return data.map((point, index) => {
      if (index === 0 || point.costBasis > data[index - 1]?.costBasis) {
        const costBasisIncrease = index === 0 ? point.costBasis : point.costBasis - data[index - 1].costBasis
        sp500CostBasis += costBasisIncrease
      }
      
      const portfolioPerformance = point.costBasis > 0 
        ? ((point.portfolioValue - point.costBasis) / point.costBasis) * 100 
        : 0
      
      const sp500Performance = sp500CostBasis > 0 
        ? ((point.sp500Value - sp500CostBasis) / sp500CostBasis) * 100 
        : 0
      
      return {
        date: point.date,
        portfolioPerformance,
        sp500Performance
      }
    })
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchPortfolioHistory() {
      try {
        const response = await fetch('/api/portfolio-history', {
          signal: controller.signal,
          // Add cache headers for better performance
          headers: {
            'Cache-Control': 'max-age=300' // Cache for 5 minutes
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio history')
        }
        
        const result = await response.json()
        
        if (!isMounted) return
        
        if (!result.history || result.history.length === 0) {
          setError('No portfolio history data available')
          return
        }
        
        // Process data in a web worker if available (future enhancement)
        // For now, use requestIdleCallback for non-blocking processing
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            if (!isMounted) return
            
            const performanceData = calculatePerformanceData(result.history)
            const sampledData = sampleData(result.history, 200)
            const sampledPerformanceData = sampleData(performanceData, 200)
            
            setData(sampledData)
            setPerformanceData(sampledPerformanceData)
            setLoading(false)
          })
        } else {
          // Fallback for browsers without requestIdleCallback
          const performanceData = calculatePerformanceData(result.history)
          const sampledData = sampleData(result.history, 200)
          const sampledPerformanceData = sampleData(performanceData, 200)
          
          setData(sampledData)
          setPerformanceData(sampledPerformanceData)
          setLoading(false)
        }
      } catch (err: any) {
        if (!isMounted) return
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      }
    }

    fetchPortfolioHistory()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [calculatePerformanceData, sampleData])

  // Memoized formatters
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }, [])

  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }, [])

  // Memoized tooltip components
  const CustomTooltipValue = useCallback(({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    // Hide stats when tooltip is active
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

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
                  {formatCurrency(gain)} ({!isNaN(gainPercent) ? gainPercent.toFixed(1) : '0.0'}%)
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">S&P 500 Gain:</span>
                <span className={`text-sm font-medium ${sp500Gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(sp500Gain)} ({!isNaN(sp500GainPercent) ? sp500GainPercent.toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }, [formatCurrency])

  const CustomTooltipPercentage = useCallback(({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    // Hide stats when tooltip is active
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioPerf = payload.find((p) => p.dataKey === 'portfolioPerformance')?.value as number
      const sp500Perf = payload.find((p) => p.dataKey === 'sp500Performance')?.value as number
      const outperformance = portfolioPerf - sp500Perf

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
              <span className={`text-sm font-medium ${portfolioPerf >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage(portfolioPerf)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-green-600 dark:text-green-400">S&P 500:</span>
              <span className={`text-sm font-medium ${sp500Perf >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage(sp500Perf)}
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
  }, [formatPercentage])

  // Memoized chart data
  const chartData = useMemo(() => showPercentage ? (performanceData || []) : (data || []), [showPercentage, performanceData, data])
  
  // Memoized tick formatter
  const dateTickFormatter = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' })
  }, [])

  const percentageTickFormatter = useCallback((value: number) => `${value.toFixed(0)}%`, [])
  const currencyTickFormatter = useCallback((value: number) => `$${(value / 1000).toFixed(0)}k`, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Portfolio Performance...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>
              Track your portfolio value and performance over time
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="percentage-mode"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
            />
            <Label htmlFor="percentage-mode" className="text-sm">
              Show %
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Portfolio stats cards - only show when not hovering over chart */}
        {!hideStats && portfolioStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {portfolioStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {stat.subtitle}
                      </p>
                    )}
                    {stat.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {stat.description}
                      </p>
                    )}
                  </div>
                  <stat.icon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={dateTickFormatter}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={showPercentage ? percentageTickFormatter : currencyTickFormatter}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={showPercentage ? <CustomTooltipPercentage /> : <CustomTooltipValue />}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {showPercentage ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="portfolioPerformance" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Portfolio"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sp500Performance" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="S&P 500"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Portfolio Value"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sp500Value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="S&P 500 Value"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="costBasis" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Cost Basis"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return JSON.stringify(prevProps.portfolioStats) === JSON.stringify(nextProps.portfolioStats)
})

PortfolioChart.displayName = 'PortfolioChart'