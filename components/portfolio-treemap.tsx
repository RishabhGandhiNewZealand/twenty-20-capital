"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

interface TreemapData {
  name: string
  symbol: string
  value: number
  percentage: number
  color: string
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
  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValueNZD, 0)
  
  // Transform holdings data for treemap - filter out holdings less than 0.1%
  const treemapData: TreemapData[] = holdings
    .map((holding, index) => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.currentValueNZD,
      percentage: (holding.currentValueNZD / totalValue) * 100,
      // Use darker colors
      color: `hsl(${(index * 360) / holdings.length}, 40%, 35%)`
    }))
    .filter(item => item.percentage >= 0.1)

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
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#000"
              fontSize={Math.min(16, width / 5)}
              fontWeight="bold"
              className="pointer-events-none"
            >
              {symbol}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#000"
              fontSize={Math.min(14, width / 6)}
              className="pointer-events-none"
            >
              {percentage?.toFixed(1) || '0.0'}%
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
        <div className="h-[250px] sm:h-[350px] w-full">
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
      </CardContent>
    </Card>
  )
}