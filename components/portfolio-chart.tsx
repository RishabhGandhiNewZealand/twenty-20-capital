"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CalendarIcon } from "lucide-react"
import { formatPercentage as formatPercentageBase, calculateTWRPerformanceData } from "@/lib/financial-calculations"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { cn } from "@/lib/utils"
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

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'YTD' | '5Y' | 'ALL' | 'CUSTOM'

export function PortfolioChart({ portfolioStats = [], historyPath = "/api/portfolio-history", historyHeaders, anonymizeOverride }: PortfolioChartProps) {
  const [allPerformanceData, setAllPerformanceData] = useState<PerformanceData[]>([])
  const [filteredData, setFilteredData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hideStats, setHideStats] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('ALL')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
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
        
        setAllPerformanceData(performanceData)
        setFilteredData(performanceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioHistory()
  }, [historyPath, historyHeaders])

  // Filter and recalculate TWR based on selected period
  useEffect(() => {
    if (allPerformanceData.length === 0) return

    const now = new Date()
    let startDate: Date | null = null

    switch (selectedPeriod) {
      case '1M':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3M':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6M':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '1Y':
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case '5Y':
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 5)
        break
      case 'CUSTOM':
        if (customStartDate) {
          startDate = customStartDate
        }
        break
      case 'ALL':
      default:
        setFilteredData(allPerformanceData)
        return
    }

    if (!startDate) {
      setFilteredData(allPerformanceData)
      return
    }

    // Filter data by date range
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = selectedPeriod === 'CUSTOM' && customEndDate 
      ? customEndDate.toISOString().split('T')[0]
      : now.toISOString().split('T')[0]

    const filtered = allPerformanceData.filter(d => {
      return d.date >= startDateStr && d.date <= endDateStr
    })

    if (filtered.length === 0) {
      setFilteredData(allPerformanceData)
      return
    }

    // Recalculate TWR starting from 0% for this period
    const firstPoint = filtered[0]
    const rebasedData = filtered.map(point => ({
      date: point.date,
      portfolioPerformance: point.portfolioPerformance - firstPoint.portfolioPerformance,
      sp500Performance: point.sp500Performance - firstPoint.sp500Performance
    }))

    setFilteredData(rebasedData)
  }, [selectedPeriod, allPerformanceData, customStartDate, customEndDate])

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

  if (filteredData.length === 0) {
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

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    if (period !== 'CUSTOM') {
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
    }
  }

  const timeButtons: Array<{ label: string; value: TimePeriod }> = [
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: 'YTD', value: 'YTD' },
    { label: '5Y', value: '5Y' },
    { label: 'All', value: 'ALL' },
  ]

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Performance (Time-Weighted Return)</CardTitle>
          
          {/* Time Period Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {timeButtons.map(({ label, value }) => (
              <Button
                key={value}
                variant={selectedPeriod === value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(value)}
                className={cn(
                  "text-xs h-8 px-3",
                  selectedPeriod === value 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "hover:bg-gray-100"
                )}
              >
                {label}
              </Button>
            ))}
            
            {/* Custom Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedPeriod === 'CUSTOM' ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-8 px-3",
                    selectedPeriod === 'CUSTOM'
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "hover:bg-gray-100"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCustomStartDate(new Date(e.target.value))
                          setSelectedPeriod('CUSTOM')
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-medium">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      min={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                      value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value && customStartDate) {
                          setCustomEndDate(new Date(e.target.value))
                          setSelectedPeriod('CUSTOM')
                        }
                      }}
                      disabled={!customStartDate}
                      className="w-full"
                    />
                  </div>
                  {customStartDate && customEndDate && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      <p className="font-medium mb-1">Selected Range:</p>
                      <p className="text-xs">
                        {customStartDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })} - {customEndDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
            <LineChart
              data={filteredData}
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
                domain={[
                  (dataMin: number) => Math.min(0, Math.floor(dataMin) - 5),
                  (dataMax: number) => Math.max(0, Math.ceil(dataMax) + 5)
                ]}
                width={anonymized ? 10 : 40}
                axisLine={true}
                tickLine={!anonymized}
              />
              <Tooltip content={<CustomTooltipPercentage />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="line"
              />
              {/* Reference line at 0% */}
              <Line 
                type="monotone" 
                dataKey={() => 0} 
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name="0% Baseline"
                dot={false}
                legendType="none"
              />
              <Line 
                type="monotone" 
                dataKey="portfolioPerformance" 
                stroke="#00a37a"
                strokeWidth={2.5}
                name="Portfolio TWR"
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="sp500Performance" 
                stroke="#6b7280"
                strokeWidth={2.5}
                name="S&P 500 TWR"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}