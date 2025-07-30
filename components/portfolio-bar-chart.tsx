"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState, useRef } from "react"
import { Loader2, Play, Pause } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface BarChartData {
  name: string
  symbol: string
  value: number
  percentage: number
  color: string
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
  const [loading, setLoading] = useState(false)
  const [barChartData, setBarChartData] = useState<BarChartData[]>([])
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize with current holdings
  useEffect(() => {
    if (currentHoldings && currentHoldings.length > 0) {
      const totalValue = currentHoldings.reduce((sum, h) => sum + h.currentValueNZD, 0)
      const data = currentHoldings
        .filter(h => h.currentValueNZD > 0)
        .map(holding => ({
          name: holding.name,
          symbol: holding.symbol,
          value: holding.currentValueNZD,
          percentage: (holding.currentValueNZD / totalValue) * 100,
          color: getCompanyColor(holding.symbol)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15) // Top 15 holdings

      setBarChartData(data)
    }
  }, [currentHoldings])

  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/portfolio-composition')
        if (response.ok) {
          const data = await response.json()
          if (data.compositionData) {
            setHistoricalData(data.compositionData)
            const dates = Object.keys(data.compositionData).sort()
            setAvailableDates(dates)
            setCurrentDateIndex(dates.length - 1) // Start with most recent
            updateChartData(data.compositionData, dates.length - 1, dates)
          }
        }
      } catch (error) {
        console.error('Failed to load historical data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistoricalData()
  }, [])

  // Update chart data based on selected date
  const updateChartData = (data: any, index: number, dates: string[]) => {
    if (!data || !dates[index]) return

    const selectedDate = dates[index]
    const holdings = data[selectedDate]
    
    if (holdings && Array.isArray(holdings)) {
      const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.value || 0), 0)
      const chartData = holdings
        .filter((h: any) => h.value > 0 && h.percentage >= 0.1)
        .map((holding: any) => ({
          name: holding.name,
          symbol: holding.symbol,
          value: holding.value,
          percentage: holding.percentage,
          color: getCompanyColor(holding.symbol)
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 15)

      setBarChartData(chartData)
    }
  }

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0]
    setCurrentDateIndex(newIndex)
    updateChartData(historicalData, newIndex, availableDates)
  }

  // Play/pause functionality
  const togglePlay = () => {
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
      
      // Reset to beginning if at the end
      if (currentDateIndex >= availableDates.length - 1) {
        setCurrentDateIndex(0)
        updateChartData(historicalData, 0, availableDates)
      }

      // Set up interval
      playIntervalRef.current = setInterval(() => {
        setCurrentDateIndex(prevIndex => {
          const nextIndex = prevIndex + 1
          
          if (nextIndex >= availableDates.length) {
            // Reached the end, stop playing
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
              playIntervalRef.current = null
            }
            return prevIndex
          }

          // Update chart with new data
          updateChartData(historicalData, nextIndex, availableDates)
          return nextIndex
        })
      }, 200) // Update every 200ms
    }
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

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

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={4} 
          textAnchor="end" 
          fill="#374151"
          className="text-xs sm:text-sm"
        >
          {payload.value}
        </text>
      </g>
    )
  }

  const totalValue = barChartData.reduce((sum, h) => sum + h.value, 0)

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
                disabled={loading}
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
                  value={[currentDateIndex]}
                  onValueChange={handleSliderChange}
                  max={availableDates.length - 1}
                  step={1}
                  className="w-full"
                  disabled={isPlaying || loading}
                />
              </div>
            </div>
            {availableDates[currentDateIndex] && (
              <div className="text-center text-sm text-gray-600">
                {formatDate(availableDates[currentDateIndex])}
              </div>
            )}
          </div>
        )}

        {/* Bar Chart */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : barChartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No holdings data available
          </div>
        ) : (
          <div className="h-[400px] sm:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  dataKey="symbol"
                  type="category"
                  tick={<CustomYAxisTick />}
                  width={80}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
          Showing top 15 holdings by value (minimum 0.1% of portfolio)
        </div>
      </CardContent>
    </Card>
  )
}