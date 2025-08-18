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
  historyPath?: string
  historyHeaders?: Record<string, string>
  anonymizeOverride?: boolean
}

export function PortfolioChart({ portfolioStats = [], historyPath = "/api/portfolio-history", historyHeaders, anonymizeOverride }: PortfolioChartProps) {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(false)
  const [hideStats, setHideStats] = useState(false)
  const { isAnonymized } = useAnonymization()
  const anonymized = typeof anonymizeOverride === 'boolean' ? anonymizeOverride : isAnonymized

  useEffect(() => {
    async function fetchPortfolioHistory() {
      try {
        const timestamp = Date.now()
        const response = await fetch(`${historyPath}?t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...(historyHeaders || {})
          } as HeadersInit
        })
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio history')
        }
        const result = await response.json()
        
        if (!result.history || result.history.length === 0) {
          setError('No portfolio history data available')
          return
        }
        
        const formattedData = result.history
        
        const performanceData = calculatePerformanceData(formattedData)
        
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
  }, [historyPath, historyHeaders])

  function calculatePerformanceData(data: PortfolioHistoryData[]): PerformanceData[] {
    if (data.length === 0) return []
    
    // Ensure chronological order
    const ordered = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    let sp500CostBasis = 0
    let previousCostBasis = 0
    
    return ordered.map((point, index) => {
      if (index === 0) {
        sp500CostBasis = point.costBasis
        previousCostBasis = point.costBasis
      } else if (point.costBasis > previousCostBasis) {
        const newCapital = point.costBasis - previousCostBasis
        sp500CostBasis += newCapital
        previousCostBasis = point.costBasis
      }
      
      const portfolioPerformance = point.costBasis > 0 
        ? (((point.portfolioValue - point.costBasis) / point.costBasis) * 100) 
        : 0
      
      let sp500Performance = 0
      if (sp500CostBasis > 0) {
        if (point.sp500Value < 1 && index === 0) {
          sp500Performance = 0
        } else {
          sp500Performance = (((point.sp500Value - sp500CostBasis) / sp500CostBasis) * 100)
        }
      }
      
      return {
        date: point.date,
        portfolioPerformance: isNaN(portfolioPerformance) ? 0 : portfolioPerformance,
        sp500Performance: isNaN(sp500Performance) ? 0 : sp500Performance
      }
    })
  }

  function sampleData<T>(data: T[], maxPoints: number): T[] {
    if (data.length <= maxPoints) return data
    
    const step = Math.ceil(data.length / maxPoints)
    const sampled = [] as T[]
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }
    
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }
    
    return sampled
  }

  const formatPercentage = (value: number) => {
    const safe = isNaN(value) ? 0 : value
    return formatPercentageBase(safe / 100, 2)
  }

  const CustomTooltipValue = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioValue = Number(payload.find((p) => p.dataKey === 'portfolioValue')?.value) || 0
      const costBasis = Number(payload.find((p) => p.dataKey === 'costBasis')?.value) || 0
      const sp500Value = Number(payload.find((p) => p.dataKey === 'sp500Value')?.value) || 0
      const gain = portfolioValue - costBasis
      const gainPercent = costBasis > 0 ? ((gain / costBasis) * 100) : 0
      const sp500Gain = sp500Value - costBasis
      const sp500GainPercent = costBasis > 0 ? ((sp500Gain / costBasis) * 100) : 0

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
                  <span className="text-sm text-red-600">Cost Basis:</span>
                  <span className="text-sm font-medium">{formatCurrency(costBasis)}</span>
                </div>
              </>
            )}
            <div className={!isAnonymized ? "pt-2 mt-2 border-t border-[hsl(var(--border))]" : ""}>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Portfolio Gain:</span>
                <span className={`text-sm font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {!isAnonymized && `${maskCurrency(gain, isAnonymized)} `}({(isNaN(gainPercent) ? 0 : gainPercent).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">S&P 500 Gain:</span>
                <span className={`text-sm font-medium ${sp500Gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {!isAnonymized && `${maskCurrency(sp500Gain, isAnonymized)} `}({(isNaN(sp500GainPercent) ? 0 : sp500GainPercent).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomTooltipPercentage = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioPerformance = Number(payload.find((p) => p.dataKey === 'portfolioPerformance')?.value) || 0
      const sp500Performance = Number(payload.find((p) => p.dataKey === 'sp500Performance')?.value) || 0
      const outperformance = portfolioPerformance - sp500Performance

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
              <span className="text-sm text-blue-600">Portfolio:</span>
              <span className={`text-sm font-medium ${portfolioPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(portfolioPerformance)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-green-600">S&P 500:</span>
              <span className={`text-sm font-medium ${sp500Performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(sp500Performance)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-[hsl(var(--border))]">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Outperformance:</span>
                <span className={`text-sm font-medium ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              className="data-[state=checked]:bg-[hsl(var(--primary))] scale-75 sm:scale-100"
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
          {portfolioStats.length > 0 && !hideStats && (
            <div className={`absolute top-1 sm:top-2 z-10 space-y-1 sm:space-y-1.5 ${
              anonymized ? 'left-[20px] sm:left-[25px]' : 'left-[60px] sm:left-24'
            }`}>
              {portfolioStats.map((stat) => {
                return (
                  <div key={stat.title} className="bg-[hsl(var(--card))]/95 backdrop-blur-sm border border-[hsl(var(--border))] rounded-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-md">
                    <div>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight">{stat.title}</p>
                      <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--card-foreground))] leading-tight">{stat.value}</p>
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
                  tick={anonymized ? false : { fontSize: 10 }}
                  tickFormatter={(value) => `${(isNaN(value) ? 0 : value).toFixed(0)}%`}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  width={anonymized ? 10 : 40}
                  axisLine={true}
                  tickLine={!anonymized}
                />
                <Tooltip content={<CustomTooltipPercentage />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolioPerformance" 
                  stroke="#00a37a"
                  strokeWidth={2}
                  name="Portfolio Performance"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sp500Performance" 
                  stroke="#b1b1b1"
                  strokeWidth={2}
                  name="S&P 500 Performance"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
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
                  tick={anonymized ? false : { fontSize: 10 }}
                  tickFormatter={(value) => `$${((isNaN(value) ? 0 : value) / 1000).toFixed(0)}k`}
                  width={anonymized ? 10 : 45}
                  axisLine={true}
                  tickLine={!anonymized}
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