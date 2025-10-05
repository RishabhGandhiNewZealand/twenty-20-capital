"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, TrendingUp, DollarSign } from "lucide-react"
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

interface HistoryDataPoint {
  date: string
  portfolioValue: number
  costBasis: number
  sp500Value: number
}

interface ReturnDataPoint {
  date: string
  portfolioReturn: number
  sp500Return: number
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
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(false)
  const [hideStats, setHideStats] = useState(false)
  const { isAnonymized } = useAnonymization()

  useEffect(() => {
    async function fetchData() {
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
        
        // Sample data to max 200 points for performance
        const sampledData = sampleData(result.history, 200)
        setHistoryData(sampledData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Sample data to reduce number of points
  function sampleData<T>(data: T[], maxPoints: number): T[] {
    if (data.length <= maxPoints) return data
    
    const step = Math.ceil(data.length / maxPoints)
    const sampled = []
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }
    
    // Always include last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }
    
    return sampled
  }

  // Calculate return data in dollar terms
  function calculateDollarReturns(): ReturnDataPoint[] {
    return historyData.map(point => ({
      date: point.date,
      portfolioReturn: point.portfolioValue - point.costBasis,
      sp500Return: point.sp500Value - point.costBasis
    }))
  }

  // Calculate return data in percentage terms
  function calculatePercentageReturns(): ReturnDataPoint[] {
    return historyData.map(point => {
      // Handle initial data points where portfolio value might not be initialized yet
      // If portfolio value is very small (< 1% of cost basis), treat it as 0% return
      // to avoid skewing the graph with -100% values
      const isInitialPoint = point.portfolioValue < (point.costBasis * 0.01)
      
      const portfolioReturn = isInitialPoint ? 0 : (
        point.costBasis > 0 
          ? ((point.portfolioValue - point.costBasis) / point.costBasis) * 100 
          : 0
      )
      
      const sp500Return = isInitialPoint ? 0 : (
        point.costBasis > 0 
          ? ((point.sp500Value - point.costBasis) / point.costBasis) * 100 
          : 0
      )
      
      return {
        date: point.date,
        portfolioReturn,
        sp500Return
      }
    })
  }

  // Get the data to display based on view mode
  const displayData = showPercentage ? calculatePercentageReturns() : calculateDollarReturns()

  // Custom tooltip for dollar view
  const DollarTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioReturn = payload.find(p => p.dataKey === 'portfolioReturn')?.value as number
      const sp500Return = payload.find(p => p.dataKey === 'sp500Return')?.value as number
      const outperformance = portfolioReturn - sp500Return
      const portfolioReturnPercent = historyData.find(d => d.date === label)?.costBasis || 0
      const portfolioReturnPct = portfolioReturnPercent > 0 ? (portfolioReturn / portfolioReturnPercent) * 100 : 0
      const sp500ReturnPct = portfolioReturnPercent > 0 ? (sp500Return / portfolioReturnPercent) * 100 : 0

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
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
                {maskCurrency(portfolioReturn, isAnonymized)} ({portfolioReturn >= 0 ? '+' : ''}{portfolioReturnPct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">S&P 500 Return:</span>
              <span className={`text-sm font-medium ${sp500Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {maskCurrency(sp500Return, isAnonymized)} ({sp500Return >= 0 ? '+' : ''}{sp500ReturnPct.toFixed(1)}%)
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Outperformance:</span>
                <span className={`text-sm font-medium ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {maskCurrency(outperformance, isAnonymized)}
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
  const PercentageTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    useEffect(() => {
      setHideStats(active || false)
    }, [active])

    if (active && payload && payload.length) {
      const portfolioReturn = payload.find(p => p.dataKey === 'portfolioReturn')?.value as number
      const sp500Return = payload.find(p => p.dataKey === 'sp500Return')?.value as number
      const outperformance = portfolioReturn - sp500Return

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
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
                {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">S&P 500 Return:</span>
              <span className={`text-sm font-medium ${sp500Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sp500Return >= 0 ? '+' : ''}{sp500Return.toFixed(2)}%
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600">Outperformance:</span>
                <span className={`text-sm font-medium ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(2)}%
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
              <p className="text-sm text-gray-500 mt-1">Fetching historical data</p>
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

  if (historyData.length === 0) {
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
          <CardTitle className="text-gray-900 text-lg sm:text-xl">
            Time-Weighted Returns
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dollar</span>
            </Label>
            <Switch
              id="view-toggle"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
              className="data-[state=checked]:bg-blue-600 scale-75 sm:scale-100"
            />
            <Label htmlFor="view-toggle" className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Percent</span>
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
            <LineChart
              data={displayData}
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
                tick={showPercentage || !isAnonymized ? { fontSize: 10 } : false}
                tickFormatter={(value) => 
                  showPercentage 
                    ? `${value.toFixed(0)}%` 
                    : `$${(value / 1000).toFixed(0)}k`
                }
                width={showPercentage || !isAnonymized ? 45 : 10}
                axisLine={true}
                tickLine={showPercentage || !isAnonymized}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={showPercentage ? <PercentageTooltip /> : <DollarTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="line"
              />
              
              {/* Zero reference line */}
              <Line 
                type="monotone" 
                dataKey={() => 0} 
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Break Even"
                dot={false}
                legendType="none"
              />
              
              {/* Portfolio returns */}
              <Line 
                type="monotone" 
                dataKey="portfolioReturn" 
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Portfolio Return"
                dot={false}
                activeDot={{ r: 5 }}
              />
              
              {/* S&P 500 returns */}
              <Line 
                type="monotone" 
                dataKey="sp500Return" 
                stroke="#94a3b8"
                strokeWidth={2}
                name="S&P 500 Return"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
