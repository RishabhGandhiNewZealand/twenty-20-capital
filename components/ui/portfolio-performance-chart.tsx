"use client"

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DailyPortfolioData } from '@/lib/portfolioPerformance'
import { Loader2 } from 'lucide-react'

interface PortfolioPerformanceChartProps {
  className?: string
}

export function PortfolioPerformanceChart({ className }: PortfolioPerformanceChartProps) {
  const [data, setData] = useState<DailyPortfolioData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/portfolio/performance')
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio performance data')
        }
        
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        console.error('Error fetching portfolio performance:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-NZ', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={`aspect-video bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading portfolio performance...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`aspect-video bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error loading chart</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`aspect-video bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-gray-500">No performance data available</p>
        </div>
      </div>
    )
  }

  // Sample data for tick formatting (to avoid too many labels)
  const tickFormatter = (value: string, index: number) => {
    // Show every nth tick based on data length
    const totalTicks = data.length
    const maxTicks = 8
    const step = Math.ceil(totalTicks / maxTicks)
    
    if (index % step === 0 || index === totalTicks - 1) {
      return formatDate(value)
    }
    return ''
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={tickFormatter}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <Line
            type="monotone"
            dataKey="portfolioValue"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Portfolio Value"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="costBasis"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Cost Basis"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}