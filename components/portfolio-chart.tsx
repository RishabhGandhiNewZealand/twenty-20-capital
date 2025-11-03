"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { formatPercentage as formatPercentageBase, calculateTWRPerformanceData } from "@/lib/financial-calculations"
import { useAnonymization } from "@/contexts/AnonymizationContext"
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
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        
        // Use TWR-based performance calculation
        const performanceData = calculateTWRPerformanceData(formattedData)
        
        const sampledPerformanceData = sampleData(performanceData, 200)
        
        setPerformanceData(sampledPerformanceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioHistory()
  }, [historyPath, historyHeaders])

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

  if (performanceData.length === 0) {
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
        <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance (Time-Weighted Return)</CardTitle>
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
                name="Portfolio TWR"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="sp500Performance" 
                stroke="#b1b1b1"
                strokeWidth={2}
                name="S&P 500 TWR"
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}