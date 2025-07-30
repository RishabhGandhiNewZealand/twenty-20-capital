"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, Play, Pause } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { getLogoUrl } from "@/lib/company-utils"
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
  const [isMobile, setIsMobile] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 0.5, 1, or 2
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

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
      
      const intervalTime = playbackSpeed === 0.5 ? 100 : playbackSpeed === 2 ? 25 : 50
      
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
      }, intervalTime)
    }
  }, [isPlaying, sliderValue, availableDates.length, playbackSpeed])

  // Update speed and restart if playing
  const changeSpeed = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed)
    if (isPlaying) {
      // Stop and restart with new speed
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
      
      const intervalTime = newSpeed === 0.5 ? 100 : newSpeed === 2 ? 25 : 50
      
      playIntervalRef.current = setInterval(() => {
        setSliderValue(prev => {
          if (prev >= availableDates.length - 1) {
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
              playIntervalRef.current = null
            }
            return prev
          }
          return prev + 1
        })
      }, intervalTime)
    }
  }

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
  }, [chartData.length]) // Only depend on length to avoid infinite loops

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Custom bar shape to include value text inside
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill, value, index } = props
    const data = chartData[index]
    const showValue = width > (isMobile ? 50 : 60)
    
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill} 
          rx={4} 
          ry={4}
        />
        {showValue && (
          <text 
            x={x + (isMobile ? 5 : 10)} 
            y={y + height / 2} 
            fill="white" 
            textAnchor="start" 
            dominantBaseline="middle"
            fontSize={isMobile ? "10" : "11"}
            fontWeight="500"
          >
            {formatCurrency(value)}
          </text>
        )}
        <text 
          x={x + width + 5} 
          y={y + height / 2} 
          fill="#4b5563" 
          textAnchor="start" 
          dominantBaseline="middle"
          fontSize={isMobile ? "10" : "11"}
          fontWeight="600"
        >
          {data.percentage.toFixed(1)}%
        </text>
      </g>
    )
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

  // Custom Y-axis tick component to render company logos
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const logoUrl = getLogoUrl(payload.value)
    // Adjust position to align with CardHeader padding (16px on mobile, 24px on desktop)
    const leftAlign = isMobile ? -81 : -89
    
    return (
      <g transform={`translate(${x},${y})`}>
        <image 
          href={logoUrl} 
          x={leftAlign} 
          y={-10} 
          width={20} 
          height={20}
          preserveAspectRatio="xMidYMid meet"
        />
        <text 
          x={leftAlign + 25} 
          y={4} 
          textAnchor="start" 
          fontSize={12}
          fontWeight={600}
          fill="#374151"
        >
          {payload.value}
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
      <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-gray-900 text-lg sm:text-xl">
              Portfolio Allocation
              {displayDate && (
                <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 block sm:inline">
                  as of {formatDate(displayDate)}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlay}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Play</span>
                  </>
                )}
              </Button>
              <div className="flex items-center gap-0.5 border rounded-md">
                <button
                  onClick={() => changeSpeed(0.5)}
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${
                    playbackSpeed === 0.5 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  0.5x
                </button>
                <button
                  onClick={() => changeSpeed(1)}
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${
                    playbackSpeed === 1 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  1x
                </button>
                <button
                  onClick={() => changeSpeed(2)}
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${
                    playbackSpeed === 2 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2x
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
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
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {displayDate ? formatDate(displayDate) : 'Today'}
            </span>
          </div>
        </div>
              </CardHeader>
        <CardContent className="overflow-visible px-4 sm:px-6 py-0">
          {chartData.length === 0 ? (
          <div className="h-[450px] sm:h-[550px] flex items-center justify-center">
            <p className="text-gray-500">No holdings data available for this date</p>
          </div>
        ) : (
          <div className="h-[450px] sm:h-[550px] w-full overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ 
                  top: 20, 
                  right: 45, 
                  left: 65, 
                  bottom: 20 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  tickFormatter={formatTickValue}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="symbol" 
                  tick={<CustomYAxisTick />}
                  width={65}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  shape={<CustomBar />}
                  animationDuration={300}
                  isAnimationActive={true}
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