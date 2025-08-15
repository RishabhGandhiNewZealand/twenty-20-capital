"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Loader2 } from "lucide-react"
import { getCompanyColor } from "@/lib/company-colors"
import { getLogoUrl } from "@/lib/company-utils"
import { formatCurrency } from "@/lib/financial-calculations"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency } from "@/lib/anonymization-utils"

interface ChartData {
  name: string
  symbol: string
  value: number
  percentage: number
  color: string
}

interface UserPortfolioAllocationProps {
  holdings: Array<{
    symbol: string
    name: string
    currentValueNZD: number
    gainNZD: number
    gainPercent: number
  }>
  loading?: boolean
}

export function UserPortfolioAllocation({ holdings, loading = false }: UserPortfolioAllocationProps) {
  const { isAnonymized } = useAnonymization()

  // Transform holdings to chart data
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValueNZD, 0)
  
  const chartData: ChartData[] = holdings
    .filter(holding => holding.currentValueNZD > 0)
    .map(holding => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.currentValueNZD,
      percentage: (holding.currentValueNZD / totalValue) * 100,
      color: getCompanyColor(holding.symbol)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Show top 10 holdings

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartData
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={getLogoUrl(data.symbol)} 
              alt={data.symbol}
              className="h-6 w-6 rounded-full"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${data.symbol}&background=0a1a16&color=f5f5f5`
              }}
            />
            <div>
              <p className="font-medium text-gray-900">{data.symbol}</p>
              <p className="text-xs text-gray-500">{data.name}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">Value:</span>
              <span className="font-medium">
                {isAnonymized ? "NZ$***" : formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-600">Allocation:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
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
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card className="border-blue-100">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No holdings data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-gray-900 text-lg sm:text-xl">
          Current Portfolio Allocation
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Top 10 holdings by value
        </p>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-4">
        <div className="h-[400px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={[0, 'dataMax']}
              />
              <YAxis 
                type="category" 
                dataKey="symbol" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Holdings List for Mobile */}
        <div className="mt-6 sm:hidden">
          <div className="space-y-3">
            {chartData.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={getLogoUrl(holding.symbol)} 
                    alt={holding.symbol}
                    className="h-8 w-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=0a1a16&color=f5f5f5`
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{holding.symbol}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{holding.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{holding.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">
                    {isAnonymized ? "NZ$***" : formatCurrency(holding.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {isAnonymized ? "NZ$***" : formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Holdings</p>
              <p className="text-lg font-semibold text-gray-900">{holdings.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}