"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, Play, Pause } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"

interface BarChartData {
  name: string
  symbol: string
  value: number
  percentage: number
  color: string
}

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

interface PortfolioBarChartProps {
  holdings?: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
}

export function PortfolioBarChart({ holdings: currentHoldings }: PortfolioBarChartProps) {
  const [compositionData, setCompositionData] = useState<CompositionCache | null>(null)
  const [displayHoldings, setDisplayHoldings] = useState<HoldingAtDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayDate, setDisplayDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load historical composition data
  useEffect(() => {
    const loadCompositionData = async () => {
      try {
        const response = await fetch('/api/portfolio-composition')
        if (!response.ok) {
          throw new Error('Failed to load composition data')
        }
        const data = await response.json()
        setCompositionData(data.compositionData)
        
        // Set available dates from the data
        const dates = Object.keys(data.compositionData).sort()
        setAvailableDates(dates)
        
        // Set initial display to most recent date
        if (dates.length > 0) {
          const mostRecentDate = dates[dates.length - 1]
          setDisplayDate(mostRecentDate)
          setSliderValue(dates.length - 1)
          setDisplayHoldings(data.compositionData[mostRecentDate] || [])
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading composition data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        
        // Fall back to current holdings if available
        if (currentHoldings) {
          const totalValue = currentHoldings.reduce((sum, h) => sum + h.currentValueNZD, 0)
          const fallbackHoldings: HoldingAtDate[] = currentHoldings.map(h => ({
            symbol: h.symbol,
            name: h.name,
            shares: 0,
            value: h.currentValueNZD,
            percentage: (h.currentValueNZD / totalValue) * 100,
            currency: 'NZD'
          }))
          setDisplayHoldings(fallbackHoldings)
          setDisplayDate(new Date().toISOString().split('T')[0])
          setAvailableDates([new Date().toISOString().split('T')[0]])
          setSliderValue(0)
        }
        
        setLoading(false)
      }
    }

    loadCompositionData()
  }, [currentHoldings])

  // Update display when slider changes
  const handleSliderChange = useCallback((value: number[]) => {
    const index = value[0]
    setSliderValue(index)
    
    if (compositionData && availableDates.length > 0) {
      const selectedDate = availableDates[index]
      setDisplayDate(selectedDate)
      setDisplayHoldings(compositionData[selectedDate] || [])
    }
  }, [compositionData, availableDates])

  // Play/pause functionality
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    } else {
      setIsPlaying(true)
      
      // Start from beginning if at the end
      if (sliderValue >= availableDates.length - 1) {
        setSliderValue(0)
        handleSliderChange([0])
      }
      
      playIntervalRef.current = setInterval(() => {
        setSliderValue(prev => {
          const next = prev + 1
          if (next >= availableDates.length) {
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
              playIntervalRef.current = null
            }
            return prev
          }
          
          // Update display for the new position
          if (compositionData && availableDates.length > 0) {
            const selectedDate = availableDates[next]
            setDisplayDate(selectedDate)
            setDisplayHoldings(compositionData[selectedDate] || [])
          }
          
          return next
        })
      }, 200) // Update every 200ms
    }
  }, [isPlaying, sliderValue, availableDates, compositionData, handleSliderChange])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Transform holdings data for bar chart
  const barChartData: BarChartData[] = displayHoldings
    .filter(holding => holding.percentage >= 0.1 && holding.value > 0)
    .map((holding) => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.value,
      percentage: holding.percentage,
      color: getCompanyColor(holding.symbol)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15) // Show top 15 holdings for better visibility

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
          <p className="text-sm">
            <span className="font-medium">Value:</span> {formatCurrency(data.value)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Percentage:</span> {data.percentage.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const data = barChartData.find(d => d.symbol === payload.value)
    if (!data) return null

    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="#374151"
          className="text-xs sm:text-sm"
        >
          {payload.value}
        </text>
      </g>
    )
  }

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Composition</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !displayHoldings.length) {
    return (
      <Card className="border-blue-100">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Composition</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-12">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalValue = displayHoldings.reduce((sum, h) => sum + h.value, 0)

  return (
    <Card className="border-blue-100">
      <CardHeader className="px-4 sm:px-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Composition</CardTitle>
          <div className="text-sm text-gray-600">
            Total Value: {formatCurrency(totalValue)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Timeline Controls */}
        {availableDates.length > 1 && (
          <div className="mb-6 space-y-4">
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
              <div className="flex-1">
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  max={availableDates.length - 1}
                  step={1}
                  className="w-full"
                  disabled={isPlaying}
                />
              </div>
            </div>
            {displayDate && (
              <div className="text-center text-sm text-gray-600">
                {formatDate(displayDate)}
              </div>
            )}
          </div>
        )}

        {/* Bar Chart */}
        {barChartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No holdings data available
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 80, bottom: 60 }}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="symbol"
                  tick={<CustomXAxisTick />}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing top holdings by value (minimum 0.1% of portfolio)
        </div>
      </CardContent>
    </Card>
  )
}