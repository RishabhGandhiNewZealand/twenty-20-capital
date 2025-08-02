"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp, TrendingDown, Loader2, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/financial-calculations"

interface EarningsData {
  symbol: string
  name: string
  nextEarningsDate?: string
  expectedEPS?: number
  expectedRevenue?: number
  previousEarningsDate?: string
  reportedEPS?: number
  reportedRevenue?: number
  previousExpectedEPS?: number
  previousExpectedRevenue?: number
  isInPortfolio: boolean
  wasInPortfolio: boolean
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      const response = await fetch('/api/earnings')
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data')
      }
      const data = await response.json()
      setEarnings(data.earnings)
    } catch (error) {
      console.error('Error fetching earnings data:', error)
      setError('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const calculateEPSBeat = (reported: number, expected: number) => {
    const beat = ((reported - expected) / expected) * 100
    return beat
  }

  const calculateRevenueBeat = (reported: number, expected: number) => {
    const beat = ((reported - expected) / expected) * 100
    return beat
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const upcomingEarnings = earnings.filter(e => e.nextEarningsDate)
  const recentEarnings = earnings.filter(e => !e.nextEarningsDate && e.previousEarningsDate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Earnings Calendar
          </h1>
          <p className="text-gray-600">
            Upcoming and recent earnings for companies in your portfolio (past & present)
          </p>
        </div>

        {/* Upcoming Earnings */}
        {upcomingEarnings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              Upcoming Earnings
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEarnings.map((company) => (
                <Card key={company.symbol} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {company.symbol}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{company.name}</p>
                      </div>
                      <Badge variant={company.isInPortfolio ? "default" : "secondary"}>
                        {company.isInPortfolio ? "Current" : "Exited"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Earnings Date</span>
                        <span className="text-sm font-medium">
                          {company.nextEarningsDate && formatDate(company.nextEarningsDate)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Expected</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">EPS</span>
                            <span className="text-sm font-medium">
                              ${company.expectedEPS?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <span className="text-sm font-medium">
                              {company.expectedRevenue && formatCurrency(company.expectedRevenue, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Earnings */}
        {recentEarnings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Recent Earnings
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentEarnings.map((company) => {
                const epsBeat = company.reportedEPS && company.previousExpectedEPS
                  ? calculateEPSBeat(company.reportedEPS, company.previousExpectedEPS)
                  : null
                const revenueBeat = company.reportedRevenue && company.previousExpectedRevenue
                  ? calculateRevenueBeat(company.reportedRevenue, company.previousExpectedRevenue)
                  : null

                return (
                  <Card key={company.symbol} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {company.symbol}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{company.name}</p>
                        </div>
                        <Badge variant={company.isInPortfolio ? "default" : "secondary"}>
                          {company.isInPortfolio ? "Current" : "Exited"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Reported Date</span>
                          <span className="text-sm font-medium">
                            {company.previousEarningsDate && formatDate(company.previousEarningsDate)}
                          </span>
                        </div>
                        
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">EPS</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Expected</span>
                              <span className="text-sm">
                                ${company.previousExpectedEPS?.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Reported</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  ${company.reportedEPS?.toFixed(2)}
                                </span>
                                {epsBeat !== null && (
                                  <Badge 
                                    variant={epsBeat >= 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {epsBeat >= 0 ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    )}
                                    {epsBeat >= 0 ? '+' : ''}{epsBeat.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Revenue</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Expected</span>
                              <span className="text-sm">
                                {company.previousExpectedRevenue && formatCurrency(company.previousExpectedRevenue, 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Reported</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {company.reportedRevenue && formatCurrency(company.reportedRevenue, 0)}
                                </span>
                                {revenueBeat !== null && (
                                  <Badge 
                                    variant={revenueBeat >= 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {revenueBeat >= 0 ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    )}
                                    {revenueBeat >= 0 ? '+' : ''}{revenueBeat.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {earnings.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600">
                No earnings reports found for your portfolio companies in the next 45 days or previous 45 days.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}