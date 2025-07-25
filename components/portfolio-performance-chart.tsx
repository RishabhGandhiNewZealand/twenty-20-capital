"use client"

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Calendar, Loader2, RefreshCw } from "lucide-react"
import { format, parseISO } from 'date-fns'

interface ChartDataPoint {
  date: string
  portfolioValue: number
  costBasis: number
}

interface PortfolioHistoryData {
  chartData: ChartDataPoint[]
  lastUpdated: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM yyyy')
  } catch {
    return dateString
  }
}

const formatTooltipDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM yyyy')
  } catch {
    return dateString
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const portfolioValue = payload.find((p: any) => p.dataKey === 'portfolioValue')?.value || 0
    const costBasis = payload.find((p: any) => p.dataKey === 'costBasis')?.value || 0
    const gain = portfolioValue - costBasis
    const gainPercentage = costBasis > 0 ? ((gain / costBasis) * 100) : 0

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{formatTooltipDate(label)}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Portfolio Value:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(portfolioValue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Cost Basis:</span>
            <span className="font-semibold text-red-600">{formatCurrency(costBasis)}</span>
          </div>
          <div className="pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span className="text-sm text-gray-600">Gain/Loss:</span>
              <span className={`font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(gain)} ({gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function PortfolioPerformanceChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPortfolioHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/portfolio-history', {
        cache: 'no-cache', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch portfolio history: ${response.status} ${errorText}`)
      }
      
      const result: PortfolioHistoryData = await response.json()
      
      if (!result.chartData || !Array.isArray(result.chartData)) {
        throw new Error('Invalid data format received from API')
      }
      
      // Filter out data points with zero values to clean up the chart
      const filteredData = result.chartData.filter(point => 
        point.portfolioValue > 0 || point.costBasis > 0
      )
      
      if (filteredData.length === 0) {
        throw new Error('No valid portfolio data available')
      }
      
      setData(filteredData)
      setLastUpdated(result.lastUpdated)
    } catch (err) {
      console.error('Error fetching portfolio history:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolioHistory()
  }, [])

  const handleRetry = () => {
    fetchPortfolioHistory()
  }

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-600 text-lg font-medium">Loading Portfolio History</p>
              <p className="text-gray-500 text-sm">Calculating daily values and cost basis...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 text-lg font-medium">Error Loading Chart</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button 
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-lg font-medium">No Data Available</p>
              <p className="text-gray-500 text-sm mb-4">Portfolio history data is not available</p>
              <button 
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const latestData = data[data.length - 1]
  const earliestData = data[0]
  const totalGain = latestData.portfolioValue - latestData.costBasis
  const totalGainPercentage = latestData.costBasis > 0 ? ((totalGain / latestData.costBasis) * 100) : 0

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2 mb-2 sm:mb-0">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance Over Time
          </CardTitle>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Last updated: {lastUpdated ? format(parseISO(lastUpdated), 'dd MMM yyyy, HH:mm') : 'Unknown'}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600">Current Value</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(latestData.portfolioValue)}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(latestData.costBasis)}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600">Total Gain/Loss</p>
            <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGain)}
            </p>
            <p className={`text-sm ${totalGainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({totalGainPercentage >= 0 ? '+' : ''}{totalGainPercentage.toFixed(1)}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6b7280"
                fontSize={12}
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
                strokeWidth={3}
                name="Portfolio Value"
                dot={false}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              />
              <Line 
                type="monotone" 
                dataKey="costBasis" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Cost Basis"
                dot={false}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}