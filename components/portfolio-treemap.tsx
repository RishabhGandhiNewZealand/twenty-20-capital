"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

interface TreemapData {
  name: string
  symbol: string
  value: number
  gain: number
  gainPercent: number
  color?: string
}

interface PortfolioTreemapProps {
  holdings: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
}

export function PortfolioTreemap({ holdings }: PortfolioTreemapProps) {
  // Transform holdings data for treemap
  const treemapData: TreemapData[] = holdings.map((holding) => ({
    name: holding.name,
    symbol: holding.symbol,
    value: holding.currentValueNZD,
    gain: holding.gainNZD,
    gainPercent: holding.gainPercent,
    // Color based on gain/loss
    color: holding.gainNZD >= 0 
      ? `hsl(142, ${Math.min(70, Math.abs(holding.gainPercent))}%, ${50 - Math.min(20, Math.abs(holding.gainPercent) / 2)}%)`
      : `hsl(0, ${Math.min(70, Math.abs(holding.gainPercent))}%, ${50 - Math.min(20, Math.abs(holding.gainPercent) / 2)}%)`
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.symbol}</p>
          <p className="text-sm text-gray-600">{data.name}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">Value:</span>
              <span className="font-medium ml-1">{formatCurrency(data.value)}</span>
            </p>
            <p className={`text-sm ${data.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Return:</span>
              <span className="font-medium ml-1">
                {formatCurrency(data.gain)} ({data.gainPercent >= 0 ? '+' : ''}{data.gainPercent.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomContent = (props: any) => {
    const { x, y, width, height, symbol, value, gainPercent, color } = props
    
    // Only show content if the rectangle is large enough
    if (width < 50 || height < 30) return null

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
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={Math.min(16, width / 6)}
              fontWeight="bold"
            >
              {symbol}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={Math.min(14, width / 8)}
            >
              {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
            </text>
          </>
        )}
      </g>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Positive Returns</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Negative Returns</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}