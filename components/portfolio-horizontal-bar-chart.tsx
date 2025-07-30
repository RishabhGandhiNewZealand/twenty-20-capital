"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, Play, Pause } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { PORTFOLIO_INCEPTION_DATE } from "@/lib/constants"

interface ChartData {
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

interface PortfolioHorizontalBarChartProps {
  holdings?: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
}

export function PortfolioHorizontalBarChart({ holdings: currentHoldings }: PortfolioHorizontalBarChartProps) {
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
        
        // Set initial slider to the latest date
        if (dates.length > 0) {
          setSliderValue(dates.length - 1)
          setDisplayDate(dates[dates.length - 1])
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
        setDisplayHoldings(cacheRef.current.get(selectedDate)!)
        return
      }

      // Check pre-cached data
      if (compositionData && compositionData[selectedDate]) {
        const holdings = compositionData[selectedDate]
        cacheRef.current.set(selectedDate, holdings)
        setDisplayHoldings(holdings)
        return
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
      const totalValue = currentHoldings.reduce((sum, holding) => {
        const value = holding.currentValueNZD || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0)
      
      if (totalValue > 0) {
        const transformed: HoldingAtDate[] = currentHoldings
          .filter(holding => holding.currentValueNZD > 0 && !isNaN(holding.currentValueNZD))
          .map(holding => ({
            symbol: holding.symbol,
            name: holding.name,
            shares: 0, // Not used in display
            value: holding.currentValueNZD,
            percentage: (holding.currentValueNZD / totalValue) * 100,
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
          return prev + 1
        })
      }, 100) // Update every 100ms for smooth animation
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

  // Transform holdings data for bar chart and sort by value
  const chartData: ChartData[] = displayHoldings
    .filter(holding => {
      // Ensure we have valid numeric values
      const hasValidPercentage = typeof holding.percentage === 'number' && 
                                !isNaN(holding.percentage) && 
                                isFinite(holding.percentage) && 
                                holding.percentage >= 0.1;
      const hasValidValue = typeof holding.value === 'number' && 
                           !isNaN(holding.value) && 
                           isFinite(holding.value) && 
                           holding.value > 0;
      return hasValidPercentage && hasValidValue;
    })
    .map((holding) => ({
      name: holding.name || holding.symbol,
      symbol: holding.symbol,
      value: Math.round(holding.value), // Round to avoid decimal issues
      percentage: Math.round(holding.percentage * 10) / 10, // Round to 1 decimal place
      color: getCompanyColor(holding.symbol)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15) // Show top 15 holdings for better visibility

  // Debug logging
  useEffect(() => {
    if (chartData.length > 0) {
      console.log('Chart data:', chartData);
    }
  }, [chartData])

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
      const holding = displayHoldings.find(h => h.symbol === data.symbol)
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.symbol}</p>
          <p className="text-sm text-gray-600 mb-2">{holding?.name}</p>
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

  const formatTickValue = (value: number) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${Math.round(value)}`
  }

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] sm:h-[550px] flex items-center justify-center">
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
          <div className="h-[450px] sm:h-[550px] flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
          <div className="h-[450px] sm:h-[550px] flex items-center justify-center">
            <p className="text-gray-500">No holdings data available for this date</p>
          </div>
        ) : (
          <div className="h-[450px] sm:h-[550px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  tickFormatter={formatTickValue}
                  tick={{ fontSize: 12 }}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="symbol" 
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={300}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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