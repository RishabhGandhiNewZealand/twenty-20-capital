"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface PortfolioHistoryData {
  date: string
  portfolioValue: number
  costBasis: number
}

export function PortfolioChart() {
  const [data, setData] = useState<PortfolioHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPortfolioHistory() {
      try {
        console.log('Fetching portfolio history...')
        const response = await fetch('/api/portfolio-history')
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio history')
        }
        const result = await response.json()
        console.log('Portfolio history result:', result)
        
        if (!result.history || result.history.length === 0) {
          setError('No portfolio history data available')
          return
        }
        
        // Format data for the chart - keep original format for now
        const formattedData = result.history
        
        // Sample data to reduce points for better performance
        const sampledData = sampleData(formattedData, 200)
        console.log('Sampled data:', sampledData.length, 'points')
        setData(sampledData)
      } catch (err) {
        console.error('Error fetching portfolio history:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioHistory()
  }, [])

  // Sample data to reduce the number of points
  function sampleData(data: PortfolioHistoryData[], maxPoints: number): PortfolioHistoryData[] {
    if (data.length <= maxPoints) return data
    
    const step = Math.ceil(data.length / maxPoints)
    const sampled = []
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }
    
    return sampled
  }

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const portfolioValue = payload.find((p: any) => p.dataKey === 'portfolioValue')?.value
      const costBasis = payload.find((p: any) => p.dataKey === 'costBasis')?.value
      const gain = portfolioValue - costBasis
      const gainPercent = costBasis > 0 ? ((gain / costBasis) * 100) : 0

      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {new Date(label).toLocaleDateString('en-NZ', { 
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-blue-600 dark:text-blue-400">Portfolio Value:</span>
              <span className="text-sm font-medium">{formatCurrency(portfolioValue)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-red-600 dark:text-red-400">Cost Basis:</span>
              <span className="text-sm font-medium">{formatCurrency(costBasis)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gain/Loss:</span>
                <span className={`text-sm font-medium ${gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(gain)} ({gainPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Portfolio value and cost basis over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading portfolio history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Portfolio value and cost basis over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-red-600 dark:text-red-400">
            Error loading portfolio history: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Portfolio value and cost basis over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            No portfolio history data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>Portfolio value and cost basis over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={50}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-NZ', { 
                    month: 'short',
                    year: '2-digit'
                  })
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="portfolioValue" 
                stroke="#3b82f6"
                strokeWidth={2}
                name="Portfolio Value"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="costBasis" 
                stroke="#ef4444"
                strokeWidth={2}
                name="Cost Basis"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}