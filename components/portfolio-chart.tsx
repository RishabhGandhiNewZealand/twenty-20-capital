"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, TrendingUp, DollarSign } from "lucide-react"
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

/**
 * Portfolio history data with money-weighted returns
 */
interface PortfolioHistoryData {
  date: string
  portfolioValue: number
  portfolioReturn: number
  sp500Value: number
  sp500Return: number
  cashFlows: number
  totalInvested: number
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

export function PortfolioChart({ portfolioStats = [] }: PortfolioChartProps) {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(true) // Default to percentage view
  const [hideStats, setHideStats] = useState(false)
  const { isAnonymized } = useAnonymization()

  useEffect(() => {
    async function fetchPortfolioHistory() {
      try {
        const timestamp = Date.now()
        const response = await fetch(`/api/portfolio-history?t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio history')
        }
        const result = await response.json()
        
        if (!result.history || result.history.length === 0) {
          setError('No portfolio history data available')
          return
        }
        
        // Sample data to reduce points for better performance
        const sampledData = sampleData(result.history, 200)
        setData(sampledData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioHistory()
  }, [])

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
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioValue = payload.find((p) => p.dataKey === 'portfolioValue')?.value as number
      const sp500Value = payload.find((p) => p.dataKey === 'sp500Value')?.value as number
      const totalInvested = payload.find((p) => p.dataKey === 'totalInvested')?.value as number
      const portfolioReturn = payload.find((p) => p.dataKey === 'portfolioReturn')?.value as number || 0
      const sp500Return = payload.find((p) => p.dataKey === 'sp500Return')?.value as number || 0
      
      const portfolioGain = portfolioValue - totalInvested
      const sp500Gain = sp500Value - totalInvested

      return (
        <div className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-lg border border-[hsl(var(--border))]">
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))] mb-2">
            {new Date(label).toLocaleDateString('en-NZ', { 
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            {!isAnonymized && (
              <>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-blue-600">Portfolio Value:</span>
                  <span className="text-sm font-medium">{formatCurrency(portfolioValue)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-green-600">S&P 500 Value:</span>
                  <span className="text-sm font-medium">{formatCurrency(sp500Value)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-gray-600">Total Invested:</span>
                  <span className="text-sm font-medium">{formatCurrency(totalInvested)}</span>
                </div>
              </>
            )}
            <div className={!isAnonymized ? "pt-2 mt-2 border-t border-[hsl(var(--border))]" : ""}>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Portfolio Gain:</span>
                <span className={`text-sm font-medium ${portfolioGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {!isAnonymized && `${maskCurrency(portfolioGain, isAnonymized)} `}({portfolioReturn.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">S&P 500 Gain:</span>
                <span className={`text-sm font-medium ${sp500Gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {!isAnonymized && `${maskCurrency(sp500Gain, isAnonymized)} `}({sp500Return.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center gap-4 pt-1 mt-1 border-t border-[hsl(var(--border))]">
                <span className="text-sm text-gray-600">Outperformance:</span>
                <span className={`text-sm font-semibold ${(portfolioReturn - sp500Return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(portfolioReturn - sp500Return).toFixed(1)}%
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
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioReturn = payload.find((p) => p.dataKey === 'portfolioReturn')?.value as number
      const sp500Return = payload.find((p) => p.dataKey === 'sp500Return')?.value as number
      const outperformance = portfolioReturn - sp500Return

      return (
        <div className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-lg border border-[hsl(var(--border))]">
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))] mb-2">
            {new Date(label).toLocaleDateString('en-NZ', { 
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-blue-600">Portfolio Return:</span>
              <span className={`text-sm font-medium ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(portfolioReturn)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-green-600">S&P 500 Return:</span>
              <span className={`text-sm font-medium ${sp500Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(sp500Return)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-[hsl(var(--border))]">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Outperformance:</span>
                <span className={`text-sm font-semibold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <p className="text-sm text-gray-500 mt-1">Calculating money-weighted returns</p>
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
          <div className="text-red-600">
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
          <div className="text-gray-500">
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
          <div>
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Money-weighted returns vs S&P 500</p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Value</span>
            </Label>
            <Switch
              id="view-toggle"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
              className="data-[state=checked]:bg-[hsl(var(--primary))] scale-75 sm:scale-100"
            />
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Return %</span>
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[300px] sm:h-[400px] w-full relative">
          {/* Portfolio Stats Overlay */}
          {portfolioStats.length > 0 && !hideStats && (
            <div className={`absolute top-1 sm:top-2 z-10 space-y-1 sm:space-y-1.5 ${
              isAnonymized ? 'left-[20px] sm:left-[25px]' : 'left-[60px] sm:left-24'
            }`}>
              {portfolioStats.map((stat) => (
                <div key={stat.title} className="bg-[hsl(var(--card))]/95 backdrop-blur-sm border border-[hsl(var(--border))] rounded-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-md">
                  <div>
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight">{stat.title}</p>
                    <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--card-foreground))] leading-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            {showPercentage ? (
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
                  tick={isAnonymized ? false : { fontSize: 10 }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  width={isAnonymized ? 10 : 40}
                  axisLine={true}
                  tickLine={!isAnonymized}
                />
                <Tooltip content={<CustomTooltipPercentage />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolioReturn" 
                  stroke="#00a37a"
                  strokeWidth={2}
                  name="Portfolio Return"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Return" 
                  stroke="#b1b1b1"
                  strokeWidth={2}
                  name="S&P 500 Return"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                {/* Zero line for reference */}
                <Line 
                  type="monotone" 
                  dataKey={() => 0} 
                  stroke="#4b4b4b"
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
                  tick={isAnonymized ? false : { fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={isAnonymized ? 10 : 45}
                  axisLine={true}
                  tickLine={!isAnonymized}
                />
                <Tooltip content={<CustomTooltipValue />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolioValue" 
                  stroke="#00a37a"
                  strokeWidth={2}
                  name="Portfolio Value"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Value" 
                  stroke="#b1b1b1"
                  strokeWidth={2}
                  name="S&P 500 Value"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalInvested" 
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Total Invested"
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