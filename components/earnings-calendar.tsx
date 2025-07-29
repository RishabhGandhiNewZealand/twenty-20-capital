"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getLogoUrl } from "@/lib/company-utils"

interface EarningsData {
  symbol: string
  name: string
  nextEarningsDate: string | null
  lastEarningsDate: string | null
  estimatedEPS?: number
  actualEPS?: number
  isActive: boolean
  hasReported?: boolean
  daysUntilEarnings?: number
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/earnings')
      const data = await response.json()
      setEarnings(data.earnings)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderEarningsCard = (earning: EarningsData) => {
    const logoUrl = getLogoUrl(earning.symbol)
    const earningsDate = earning.hasReported 
      ? (earning.lastEarningsDate ? new Date(earning.lastEarningsDate) : null)
      : (earning.nextEarningsDate ? new Date(earning.nextEarningsDate) : null)
    
    // Special handling for Mainfreight (MFT)
    const isMainfreight = earning.symbol === 'MFT' || earning.symbol === 'MFT.NZ'
    const reportingFrequency = isMainfreight ? 'Half-Yearly' : 'Quarterly'
    
    return (
      <Card key={earning.symbol} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${earning.name} logo`}
                className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${earning.symbol}&background=0D9488&color=fff&size=40`
                }}
              />
              <div>
                <h3 className="font-semibold">{earning.symbol}</h3>
                <p className="text-sm text-gray-600">{earning.name}</p>
                {isMainfreight && (
                  <p className="text-xs text-blue-600 font-medium">{reportingFrequency} Reporting</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={earning.isActive ? "default" : "secondary"}>
                {earning.isActive ? "Active" : "Exited"}
              </Badge>
              {earning.hasReported && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Reported
                </Badge>
              )}
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            {earningsDate ? (
              <div className="flex items-center text-sm">
                {earning.hasReported ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                )}
                <span className={earning.hasReported ? "text-gray-600" : ""}>
                  {earning.hasReported ? "Reported: " : "Reports: "}
                  {format(earningsDate, 'MMM d, yyyy')}
                </span>
                {earning.daysUntilEarnings !== undefined && (
                  <span className={`ml-2 ${
                    earning.hasReported ? "text-gray-500" : 
                    earning.daysUntilEarnings <= 7 ? "text-orange-600 font-medium" : "text-gray-500"
                  }`}>
                    {earning.hasReported 
                      ? `(${Math.abs(earning.daysUntilEarnings)} days ago)`
                      : `(in ${earning.daysUntilEarnings} days)`
                    }
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>No earnings date available</span>
              </div>
            )}
            
            {(earning.estimatedEPS !== undefined || earning.actualEPS !== undefined) && (
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                {earning.hasReported && earning.actualEPS !== undefined ? (
                  <span>Actual EPS: ${earning.actualEPS.toFixed(2)}</span>
                ) : earning.estimatedEPS !== undefined ? (
                  <span>Est. EPS: ${earning.estimatedEPS.toFixed(2)}</span>
                ) : (
                  <span>EPS: N/A</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    )
  }

  // Separate companies that have reported vs upcoming
  const reportedEarnings = earnings.filter(e => e.hasReported)
  const upcomingEarnings = earnings.filter(e => !e.hasReported && e.nextEarningsDate)
  const noDateEarnings = earnings.filter(e => !e.hasReported && !e.nextEarningsDate)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio Companies Earnings</CardTitle>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>±45 days window</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upcoming Earnings */}
          {upcomingEarnings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Upcoming Earnings ({upcomingEarnings.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEarnings.map(earning => renderEarningsCard(earning))}
              </div>
            </div>
          )}

          {/* Recently Reported */}
          {reportedEarnings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Recently Reported ({reportedEarnings.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reportedEarnings.map(earning => renderEarningsCard(earning))}
              </div>
            </div>
          )}

          {/* No Date Available */}
          {noDateEarnings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                No Earnings Date Available ({noDateEarnings.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {noDateEarnings.map(earning => renderEarningsCard(earning))}
              </div>
            </div>
          )}

          {earnings.length === 0 && (
            <p className="text-gray-500 text-center py-8">No earnings data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}