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
import { formatCurrency } from "@/lib/financial-calculations"
import { formatDate } from "@/lib/format-utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency } from "@/lib/anonymization-utils"

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
    allocation?: number
    shares?: number
    currency?: string
  }>
  compositionPath?: string
  compositionDatePath?: string
  compositionHeaders?: Record<string, string>
  anonymizeOverride?: boolean
  customDate?: string // Custom date string override, e.g. "2025-01-01"
  hideControls?: boolean // Hide play/pause and slider
  staticHoldings?: boolean // If true, force display of holdings prop and disable fetching
}

export function PortfolioHorizontalBarChart({ holdings: currentHoldings, compositionPath, compositionDatePath, compositionHeaders, anonymizeOverride, customDate, hideControls = false, staticHoldings = false }: PortfolioHorizontalBarChartProps) {
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
  const { isAnonymized } = useAnonymization()
  const anonymized = typeof anonymizeOverride === 'boolean' ? anonymizeOverride : isAnonymized

  useEffect(() => {
    async function loadCompositionData() {

      if (staticHoldings && currentHoldings) {
        // Map currentHoldings to HoldingAtDate format
        // Assumes currentHoldings are already sorted and formatted correctly
        const mappedHoldings = currentHoldings.map(h => ({
          symbol: h.symbol,
          name: h.name,
          shares: h.shares || 0,
          value: h.currentValueNZD,
          percentage: h.allocation || 0,
          currency: h.currency || 'USD' // Defaulting to USD if not provided
        }))
        setDisplayHoldings(mappedHoldings)
        setCompositionData(null)
        setAvailableDates([])
        setSliderValue(0)
        setDisplayDate(customDate || null)
        setLoading(false)
        return
      }

      try {
        // Prefer historical compositions if a path is provided (user or admin)
        const path = compositionPath || '/api/portfolio-compositions'
        const response = await fetch(path, { headers: compositionHeaders as HeadersInit })
        if (!response.ok) {
          // Fallback: if no valid endpoint, but we have current holdings, show current only
          if (currentHoldings && currentHoldings.length > 0) {
            setCompositionData(null)
            setAvailableDates([])
            setSliderValue(0)
            setDisplayDate(customDate || null)
            setLoading(false)
            return
          }
          const staticResponse = await fetch('/data/portfolio-compositions.json')
          if (!staticResponse.ok) throw new Error('Failed to load composition data')
          const data = await staticResponse.json()
          setCompositionData(data)
          const dates = Object.keys(data).sort()
          setAvailableDates(dates)
          setSliderValue(dates.length - 1)
          setDisplayDate(dates[dates.length - 1])
        } else {
          const data = await response.json()
          setCompositionData(data)
          const dates = Object.keys(data).sort()
          setAvailableDates(dates)
          // Start slider at latest date; min corresponds to first trade date
          setSliderValue(dates.length - 1)
          setDisplayDate(dates[dates.length - 1])
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading composition data:', error)
        setError('Failed to load historical composition data')
        setLoading(false)
      }
    }
    loadCompositionData()
  }, [currentHoldings, compositionPath, compositionHeaders])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const dateBasePath = compositionDatePath || '/api/portfolio-composition'

    if (availableDates.length > 0 && sliderValue >= 0 && sliderValue < availableDates.length) {
      const selectedDate = availableDates[sliderValue]
      setDisplayDate(selectedDate)

      if (cacheRef.current.has(selectedDate)) {
        setDisplayHoldings(cacheRef.current.get(selectedDate)!)
        return
      }

      if (compositionData && compositionData[selectedDate]) {
        const holdings = compositionData[selectedDate]
        cacheRef.current.set(selectedDate, holdings)
        setDisplayHoldings(holdings)
        return
      }

      async function fetchComposition() {
        try {
          const response = await fetch(`${dateBasePath}/${selectedDate}`, { headers: compositionHeaders as HeadersInit })
          if (!response.ok) throw new Error('Failed to fetch composition')
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
    }
  }, [sliderValue, availableDates, compositionData, compositionHeaders, compositionDatePath])

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

  // Calculate dynamic height for the chart
  const rowHeight = 50 // px per row
  const minHeight = 450
  const totalChartHeight = Math.max(minHeight, chartData.length * rowHeight)

  // Debug logging
  useEffect(() => {
    if (chartData.length > 0) {

    }
  }, [chartData.length]) // Only depend on length to avoid infinite loops

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
        {showValue && !anonymized && (
          <text
            x={x + (isMobile ? 5 : 10)}
            y={y + height / 2}
            fill="#f5f5f5"
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
          fill="#b1b1b1"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={isMobile ? "10" : "11"}
          fontWeight="600"
        >
          {/* Show value here if it didn't fit inside the bar */}
          {!showValue && !anonymized && `${formatCurrency(value)} `}
          ({data.percentage.toFixed(1)}%)
        </text>
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const holding = displayHoldings.find(h => h.symbol === data.symbol)
      return (
        <div className="bg-[hsl(var(--card))] p-3 rounded-lg shadow-lg border border-[hsl(var(--border))]">
          <p className="font-semibold text-[hsl(var(--card-foreground))]">{data.symbol}</p>
          <p className="text-sm text-gray-600 mb-2">{holding?.name}</p>
          <div className="space-y-1">
            {!anonymized && (
              <p className="text-sm">
                <span className="text-gray-500">Value:</span>
                <span className="font-medium ml-1">{formatCurrency(data.value)}</span>
              </p>
            )}
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
    if (anonymized) return '';
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

    return (
      <g transform={`translate(${x},${y})`}>
        <image
          href={logoUrl}
          x={-50}
          y={-10}
          width={20}
          height={20}
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x={-25}
          y={4}
          textAnchor="start"
          fontSize={10}
          fontWeight={600}
          fill="#b1b1b1"
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
              <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 block sm:inline">
                as of {displayDate ? formatDate(displayDate) : new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </CardTitle>
            <div className={`flex items-center gap-1 sm:gap-2 ${hideControls ? "hidden" : ""}`}>
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
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${playbackSpeed === 0.5
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  0.5x
                </button>
                <button
                  onClick={() => changeSpeed(1)}
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${playbackSpeed === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  1x
                </button>
                <button
                  onClick={() => changeSpeed(2)}
                  className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium transition-colors ${playbackSpeed === 2
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  2x
                </button>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 sm:gap-3 w-full ${hideControls ? "hidden" : ""}`}>
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
      <CardContent className="overflow-visible">
        {chartData.length === 0 ? (
          <div className="h-[450px] sm:h-[550px] flex items-center justify-center">
            <p className="text-gray-500">No holdings data available for this date</p>
          </div>
        ) : (
          <div
            className={`w-full overflow-y-auto overflow-x-hidden transition-all duration-500 ease-in-out ${isPlaying ? 'max-h-[3000px]' : 'max-h-[600px]'
              }`}
          >
            <div style={{ height: `${totalChartHeight}px`, minHeight: '450px' }} className="w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 80, // Increased right margin for longer labels (value + %)
                    left: 0,
                    bottom: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    tickFormatter={formatTickValue}
                    tick={anonymized ? false : { fontSize: 10, fill: '#b1b1b1' }}
                    domain={[0, 'dataMax']}
                    axisLine={!anonymized}
                  />
                  <YAxis
                    type="category"
                    dataKey="symbol"
                    tick={<CustomYAxisTick />}
                    width={75}
                    axisLine={false}
                    tickLine={false}
                    interval={0} // Force show all ticks
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}