"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from "recharts"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, Play, Pause } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"

interface HoldingAtDate {
  symbol: string
  name: string
  shares: number
  value: number
  percentage: number
  currency: string
}

interface CompositionCache {
  [date: string]: HoldingAtDate[]
}

interface ChartData {
  symbol: string
  name: string
  value: number
  percentage: number
  color: string
}

interface PortfolioRaceChartProps {
  holdings?: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
}

export function PortfolioRaceChart({ holdings: currentHoldings }: PortfolioRaceChartProps) {
  const [compositionData, setCompositionData] = useState<CompositionCache | null>(null)
  const [displayHoldings, setDisplayHoldings] = useState<HoldingAtDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayDate, setDisplayDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const cacheRef = useRef<Map<string, HoldingAtDate[]>>(new Map())
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load the pre-cached composition data on mount
  useEffect(() => {
    async function loadCompositionData() {
      try {
        const response = await fetch('/data/portfolio-compositions.json')
        if (!response.ok) {
          throw new Error('Failed to load composition data')
        }
        const data = await response.json()
        setCompositionData(data)
        
        // Get available dates and sort them
        const dates = Object.keys(data).sort()
        setAvailableDates(dates)
        
        // Find the first date with actual holdings
        let initialIndex = dates.length - 1
        for (let i = dates.length - 1; i >= 0; i--) {
          if (data[dates[i]] && data[dates[i]].length > 0) {
            initialIndex = i
            break
          }
        }
        
        // Set initial slider to the latest date with holdings
        if (dates.length > 0) {
          setSliderValue(initialIndex)
          setDisplayDate(dates[initialIndex])
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading composition data:', err)
        setError('Failed to load historical composition data')
        setLoading(false)
      }
    }

    loadCompositionData()
  }, [])

  // Update display when slider value changes
  useEffect(() => {
    if (availableDates.length > 0 && sliderValue >= 0 && sliderValue < availableDates.length) {
      const selectedDate = availableDates[sliderValue]
      setDisplayDate(selectedDate)
      
      // Check cache first
      if (cacheRef.current.has(selectedDate)) {
        const cached = cacheRef.current.get(selectedDate)
        if (cached && Array.isArray(cached)) {
          setDisplayHoldings(cached)
          return
        }
      }

      // Check pre-cached data
      if (compositionData && compositionData[selectedDate]) {
        const holdings = compositionData[selectedDate]
        if (holdings && Array.isArray(holdings)) {
          cacheRef.current.set(selectedDate, holdings)
          setDisplayHoldings(holdings)
          return
        }
      }

      // If not in pre-cached data, fetch from API
      async function fetchComposition() {
        try {
          const response = await fetch(`/api/portfolio-composition/${selectedDate}`)
          if (!response.ok) {
            throw new Error('Failed to fetch composition')
          }
          const data = await response.json()
          if (data.holdings) {
            cacheRef.current.set(selectedDate, data.holdings)
            setDisplayHoldings(data.holdings)
          }
        } catch (err) {
          console.error('Error fetching composition:', err)
        }
      }

      fetchComposition()
    } else if (sliderValue === availableDates.length && currentHoldings) {
      // Use current holdings when slider is at the end
      const totalValue = currentHoldings.reduce((sum, holding) => sum + (holding.currentValueNZD || 0), 0)
      if (totalValue > 0) {
        const transformed: HoldingAtDate[] = currentHoldings.map(holding => ({
          symbol: holding.symbol,
          name: holding.name,
          shares: 0, // Not used in display
          value: holding.currentValueNZD || 0,
          percentage: totalValue > 0 ? ((holding.currentValueNZD || 0) / totalValue) * 100 : 0,
          currency: 'NZD'
        }))
        setDisplayHoldings(transformed)
        setDisplayDate(null)
      } else {
        setDisplayHoldings([])
        setDisplayDate(null)
      }
    }
  }, [sliderValue, availableDates, compositionData, currentHoldings])

  // Play/pause functionality
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Stop playing
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    } else {
      // Start playing
      setIsPlaying(true)
      
      // Reset to start if at the end
      if (sliderValue >= availableDates.length - 1) {
        setSliderValue(0)
      }
      
      playIntervalRef.current = setInterval(() => {
        setSliderValue(prev => {
          if (prev >= availableDates.length - 1) {
            // Stop at the end
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
              playIntervalRef.current = null
            }
            return prev
          }
          // Skip to next valid date
          let nextIndex = prev + 1
          while (nextIndex < availableDates.length) {
            const date = availableDates[nextIndex]
            if (compositionData && compositionData[date] && compositionData[date].length > 0) {
              return nextIndex
            }
            nextIndex++
          }
          // If no more valid dates, stop playing
          setIsPlaying(false)
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current)
            playIntervalRef.current = null
          }
          return prev
        })
      }, 50) // Update every 50ms for smooth animation
    }
  }, [isPlaying, sliderValue, availableDates.length])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Transform holdings data for race chart - show top 10
  const chartData: ChartData[] = displayHoldings
    .filter(holding => {
      return holding && 
             holding.value > 0 && 
             !isNaN(holding.value) && 
             isFinite(holding.value) &&
             !isNaN(holding.percentage) && 
             isFinite(holding.percentage)
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((holding) => ({
      symbol: holding.symbol || 'Unknown',
      name: holding.name || 'Unknown',
      value: Number(holding.value) || 0,
      percentage: Number(holding.percentage) || 0,
      color: getCompanyColor(holding.symbol || 'Unknown')
    }))
    .reverse() // Reverse to show highest at top



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.symbol}</p>
          <p className="text-sm text-gray-600 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">Value:</span>
              <span className="font-medium ml-1">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Allocation:</span>
              <span className="font-medium ml-1">{data.percentage.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

    // Custom label component for the bars
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value, chartData } = props
    
    // Only show label if bar is wide enough
    if (width < 50) return null
    
    // Find the data for this bar
    const data = chartData?.find((d: ChartData) => Math.abs(d.value - value) < 0.01)
    if (!data) return null
    
    return (
      <g>
        <text
          x={x + 10}
          y={y + height / 2}
          fill="#ffffff"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight="500"
        >
          {data.symbol}
        </text>
        <text
          x={x + width - 10}
          y={y + height / 2}
          fill="#ffffff"
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={12}
        >
          {data.percentage ? data.percentage.toFixed(1) : '0.0'}%
        </text>
      </g>
    )
  }

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate max value for consistent scale
  const validValues = chartData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
  const maxValue = validValues.length > 0 ? Math.max(...validValues, 1) : 100

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">
            Portfolio Allocation
            {displayDate && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                as of {formatDate(displayDate)}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </Button>
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {PORTFOLIO_INCEPTION_DATE.toLocaleDateString('en-NZ', { 
                  year: 'numeric',
                  month: 'short'
                })}
              </span>
              <Slider
                value={[sliderValue]}
                onValueChange={(value) => setSliderValue(value[0])}
                max={availableDates.length}
                step={1}
                className="flex-1"
                disabled={isPlaying}
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {displayDate ? formatDate(displayDate) : 'Today'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <p className="text-gray-500">No holdings data available for this date</p>
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] w-full">
            <div className="text-xs text-gray-500 mb-2">
              Showing {chartData.length} holdings
              {chartData.length > 0 && ` (Max value: ${formatCurrency(maxValue)})`}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="horizontal"
                margin={{ top: 20, right: 30, bottom: 20, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis 
                  type="number" 
                  domain={[0, 'dataMax']}
                  tick={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="symbol"
                  tick={{ fontSize: 14 }}
                  width={60}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.symbol}-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}