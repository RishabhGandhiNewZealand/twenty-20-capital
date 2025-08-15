"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { formatCurrency, formatPercentage as formatPercentageBase } from "@/lib/financial-calculations"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency } from "@/lib/anonymization-utils"
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

interface UserPortfolioChartProps {
  portfolioStats?: PortfolioStat[]
  portfolioHistory: PortfolioHistoryData[]
  loading?: boolean
}

export function UserPortfolioChart({ 
  portfolioStats = [], 
  portfolioHistory = [],
  loading = false 
}: UserPortfolioChartProps) {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(false)
  const [hideStats, setHideStats] = useState(false)
  const { isAnonymized } = useAnonymization()

  useEffect(() => {
    // Process the portfolio history data
    if (portfolioHistory && portfolioHistory.length > 0) {
      try {
        // Calculate percentage performance data
        const perfData = calculatePerformanceData(portfolioHistory)
        
        // Sample data to reduce points for better performance
        const sampledData = sampleData(portfolioHistory, 200)
        const sampledPerformanceData = sampleData(perfData, 200)
        
        setData(sampledData)
        setPerformanceData(sampledPerformanceData)
        setError(null)
      } catch (err) {
        console.error('Error processing portfolio data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred processing portfolio data')
      }
    } else if (!loading) {
      setError('No portfolio history data available')
    }
  }, [portfolioHistory, loading])

  // Calculate percentage performance relative to cost basis
  function calculatePerformanceData(data: PortfolioHistoryData[]): PerformanceData[] {
    if (data.length === 0) return []
    
    return data.map((point) => {
      // Validate input values
      const portfolioValue = isNaN(point.portfolioValue) ? 0 : point.portfolioValue
      const costBasis = isNaN(point.costBasis) ? 0 : point.costBasis
      const sp500Value = isNaN(point.sp500Value) ? 0 : point.sp500Value
      
      // Calculate portfolio performance
      const portfolioPerformance = costBasis > 0 
        ? ((portfolioValue - costBasis) / costBasis) * 100 
        : 0
      
      // Calculate S&P 500 performance
      const sp500Performance = costBasis > 0
        ? ((sp500Value - costBasis) / costBasis) * 100
        : 0
      
      return {
        date: point.date,
        portfolioPerformance: isNaN(portfolioPerformance) ? 0 : portfolioPerformance,
        sp500Performance: isNaN(sp500Performance) ? 0 : sp500Performance
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

  // Format percentage for tooltips
  const formatPercentage = (value: number) => {
    return formatPercentageBase(value / 100, 2)
  }

  // Custom tooltip for value view
  const CustomTooltipValue = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    // Hide stats when tooltip is active
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioValue = payload.find(p => p.dataKey === 'portfolioValue')?.value as number || 0
      const sp500Value = payload.find(p => p.dataKey === 'sp500Value')?.value as number || 0
      const costBasis = payload.find(p => p.dataKey === 'costBasis')?.value as number || 0
      
      // Validate values
      const validPortfolioValue = isNaN(portfolioValue) ? 0 : portfolioValue
      const validSp500Value = isNaN(sp500Value) ? 0 : sp500Value
      const validCostBasis = isNaN(costBasis) ? 0 : costBasis
      
      const portfolioGain = validPortfolioValue - validCostBasis
      const sp500Gain = validSp500Value - validCostBasis
      const portfolioGainPercent = validCostBasis > 0 ? (portfolioGain / validCostBasis) * 100 : 0
      const sp500GainPercent = validCostBasis > 0 ? (sp500Gain / validCostBasis) * 100 : 0
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">Portfolio:</span>
              <span className="font-medium text-blue-600">
                {isAnonymized ? "NZ$***" : formatCurrency(validPortfolioValue)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">S&P 500:</span>
              <span className="font-medium text-orange-600">
                {isAnonymized ? "NZ$***" : formatCurrency(validSp500Value)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">Cost Basis:</span>
              <span className="font-medium text-gray-700">
                {isAnonymized ? "NZ$***" : formatCurrency(validCostBasis)}
              </span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-600">Portfolio Gain:</span>
                <span className={`font-medium ${portfolioGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isAnonymized ? "***" : `${portfolioGain >= 0 ? '+' : ''}${formatCurrency(portfolioGain)} (${portfolioGainPercent >= 0 ? '+' : ''}${portfolioGainPercent.toFixed(1)}%)`}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-600">S&P 500 Gain:</span>
                <span className={`font-medium ${sp500Gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isAnonymized ? "***" : `${sp500Gain >= 0 ? '+' : ''}${formatCurrency(sp500Gain)} (${sp500GainPercent >= 0 ? '+' : ''}${sp500GainPercent.toFixed(1)}%)`}
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
    }, [active])

    if (active && payload && payload.length) {
      const portfolioPerf = payload.find(p => p.dataKey === 'portfolioPerformance')?.value as number
      const sp500Perf = payload.find(p => p.dataKey === 'sp500Performance')?.value as number
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">Portfolio:</span>
              <span className={`font-medium ${portfolioPerf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioPerf >= 0 ? '+' : ''}{portfolioPerf.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">S&P 500:</span>
              <span className={`font-medium ${sp500Perf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sp500Perf >= 0 ? '+' : ''}{sp500Perf.toFixed(2)}%
              </span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-600">Difference:</span>
                <span className={`font-medium ${portfolioPerf - sp500Perf >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {portfolioPerf - sp500Perf >= 0 ? '+' : ''}{(portfolioPerf - sp500Perf).toFixed(2)}%
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
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-blue-100">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="percentage-mode"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
            />
            <Label htmlFor="percentage-mode" className="text-sm text-gray-600">
              {showPercentage ? 'Percentage View' : 'Value View'}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-4">
        {/* Portfolio Stats Grid */}
        {portfolioStats.length > 0 && !hideStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {portfolioStats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 sm:p-4 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                    {stat.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
                    )}
                  </div>
                  {stat.icon && (
                    <div className="ml-2 sm:ml-3">
                      <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px] sm:h-[400px] -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={showPercentage ? performanceData : data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`
                }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (showPercentage) {
                    return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
                  }
                  if (isAnonymized) return '***'
                  return `$${(value / 1000).toFixed(0)}k`
                }}
              />
              <Tooltip 
                content={showPercentage ? <CustomTooltipPercentage /> : <CustomTooltipValue />}
              />
              <Legend 
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
              {showPercentage ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="portfolioPerformance" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    name="Your Portfolio"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sp500Performance" 
                    stroke="#ea580c" 
                    strokeWidth={2}
                    name="S&P 500"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    name="Your Portfolio"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sp500Value" 
                    stroke="#ea580c" 
                    strokeWidth={2}
                    name="S&P 500"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="costBasis" 
                    stroke="#6b7280" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="Cost Basis"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}