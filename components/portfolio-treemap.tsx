"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"

interface TreemapData {
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

interface PortfolioTreemapProps {
  holdings?: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
  hoveredDate?: string | null
}

export function PortfolioTreemap({ holdings: currentHoldings, hoveredDate }: PortfolioTreemapProps) {
  const [compositionData, setCompositionData] = useState<CompositionCache | null>(null)
  const [displayHoldings, setDisplayHoldings] = useState<HoldingAtDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayDate, setDisplayDate] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, HoldingAtDate[]>>(new Map())

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
        setLoading(false)
      } catch (err) {
        console.error('Error loading composition data:', err)
        setError('Failed to load historical composition data')
        setLoading(false)
      }
    }

    loadCompositionData()
  }, [])

  // Update display when hoveredDate changes
  useEffect(() => {
    if (!hoveredDate) {
      // Use current holdings when no date is hovered
      if (currentHoldings && currentHoldings.length > 0) {
        const totalValue = currentHoldings.reduce((sum, holding) => sum + holding.currentValueNZD, 0)
        const transformed: HoldingAtDate[] = currentHoldings.map(holding => ({
          symbol: holding.symbol,
          name: holding.name,
          shares: 0, // Not used in display
          value: holding.currentValueNZD,
          percentage: (holding.currentValueNZD / totalValue) * 100,
          currency: 'NZD'
        }))
        setDisplayHoldings(transformed)
        setDisplayDate(null)
      }
      return
    }

    // Check cache first
    if (cacheRef.current.has(hoveredDate)) {
      setDisplayHoldings(cacheRef.current.get(hoveredDate)!)
      setDisplayDate(hoveredDate)
      return
    }

    // Check pre-cached data
    if (compositionData && compositionData[hoveredDate]) {
      const holdings = compositionData[hoveredDate]
      cacheRef.current.set(hoveredDate, holdings)
      setDisplayHoldings(holdings)
      setDisplayDate(hoveredDate)
      return
    }

    // If not in pre-cached data, fetch from API
    async function fetchComposition() {
      try {
        const response = await fetch(`/api/portfolio-composition/${hoveredDate}`)
        if (!response.ok) {
          throw new Error('Failed to fetch composition')
        }
        const data = await response.json()
        if (data.holdings) {
          cacheRef.current.set(hoveredDate, data.holdings)
          setDisplayHoldings(data.holdings)
          setDisplayDate(hoveredDate)
        }
      } catch (err) {
        console.error('Error fetching composition:', err)
      }
    }

    fetchComposition()
  }, [hoveredDate, currentHoldings, compositionData])

  // Transform holdings data for treemap
  const treemapData: TreemapData[] = displayHoldings
    .filter(holding => holding.percentage >= 0.1 && holding.value > 0)
    .map((holding, index) => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.value,
      percentage: holding.percentage,
      color: `hsl(${(index * 360) / displayHoldings.length}, 40%, 35%)`
    }))
    .sort((a, b) => b.value - a.value)

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

  const CustomContent = (props: any) => {
    const { x, y, width, height, symbol, percentage, color } = props
    
    // Only show content if the rectangle is large enough AND percentage is meaningful
    if (width < 50 || height < 30 || !percentage || percentage < 0.1) return null

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
          rx={4}
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
        {width > 60 && height > 40 && percentage >= 0.1 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={Math.min(16, width / 5)}
              fontWeight="300"
              className="pointer-events-none"
              style={{ fill: '#ffffff' }}
            >
              {symbol}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={Math.min(14, width / 6)}
              fontWeight="300"
              className="pointer-events-none"
              style={{ fill: '#ffffff' }}
            >
              {percentage.toFixed(1)}%
            </text>
          </>
        )}
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
          <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
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
          <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (treemapData.length === 0) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg sm:text-xl">
            Portfolio Allocation
            {displayDate && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                as of {formatDate(displayDate)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
            <p className="text-gray-500">No holdings data available for this date</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="text-gray-900 text-lg sm:text-xl">
          Portfolio Allocation
          {displayDate && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              as of {formatDate(displayDate)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              content={<CustomContent />}
              isAnimationActive={true}
              animationDuration={300}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}