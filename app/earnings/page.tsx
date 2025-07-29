'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, FileText, ExternalLink, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"

interface EarningsDate {
  symbol: string
  name: string
  date: string | null
  isConfirmed: boolean
  source: string
}

interface EarningsReport {
  symbol: string
  date: string
  title: string
  url: string
  pdfUrl?: string
  quarter: string
  year: string
  fiscalQuarter?: string
  reportType?: string
}

interface EarningsData {
  nextEarnings: EarningsDate[]
  historicalReports: Record<string, EarningsReport[]>
  lastUpdated: string
}

export default function EarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchEarningsData()
  }, [])

  async function fetchEarningsData() {
    try {
      // Try main endpoint first, fall back to demo if it fails
      let response = await fetch('/api/earnings')
      if (!response.ok) {
        console.log('Main endpoint failed, trying demo endpoint...')
        response = await fetch('/api/earnings-demo')
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data')
      }
      
      const data = await response.json()
      setEarningsData(data)
    } catch (error) {
      console.error('Error fetching earnings data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64 mb-8" />
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Earnings Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!earningsData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-gray-500">Failed to load earnings data</p>
      </div>
    )
  }

  // Get unique years from all reports
  const allYears = new Set<string>()
  Object.values(earningsData.historicalReports).forEach(reports => {
    reports.forEach(report => allYears.add(report.year))
  })
  const sortedYears = Array.from(allYears).sort((a, b) => parseInt(b) - parseInt(a))

  // Filter reports by selected year
  const filteredReports: Record<string, EarningsReport[]> = {}
  Object.entries(earningsData.historicalReports).forEach(([symbol, reports]) => {
    if (selectedYear === 'all') {
      filteredReports[symbol] = reports
    } else {
      filteredReports[symbol] = reports.filter(report => report.year === selectedYear)
    }
  })

  const toggleCompany = (symbol: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol)
    } else {
      newExpanded.add(symbol)
    }
    setExpandedCompanies(newExpanded)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Earnings Calendar & Reports</h1>
        <p className="text-gray-600">
          Track upcoming earnings announcements and access historical quarterly reports for your portfolio companies
        </p>
      </div>
      
      {/* Next Earnings Dates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Earnings Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earningsData.nextEarnings.length === 0 ? (
            <p className="text-gray-500">No upcoming earnings dates found</p>
          ) : (
            <div className="space-y-4">
              {earningsData.nextEarnings.map((earning) => (
                <div key={earning.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold">{earning.symbol}</h3>
                    <p className="text-sm text-gray-600">{earning.name}</p>
                  </div>
                  <div className="text-right">
                    {earning.date ? (
                      <>
                        <p className="font-medium">
                          {format(parseISO(earning.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {earning.isConfirmed ? 'Confirmed' : 'Estimated'}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Not announced</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Historical Earnings Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historical Earnings Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter by year:</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years (5)</SelectItem>
                  {sortedYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(filteredReports).length === 0 ? (
            <p className="text-gray-500">No historical earnings reports found</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredReports).map(([symbol, reports]) => {
                const isExpanded = expandedCompanies.has(symbol)
                const displayReports = isExpanded ? reports : reports.slice(0, 4)
                
                return (
                  <div key={symbol} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{symbol}</h3>
                      {reports.length > 4 && (
                        <button
                          onClick={() => toggleCompany(symbol)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          {isExpanded ? 'Show less' : `Show all ${reports.length} reports`}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {displayReports.map((report, index) => (
                        <a
                          key={`${symbol}-${index}`}
                          href={report.url || report.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border"
                          title={report.url?.endsWith('.pdf') || report.pdfUrl?.endsWith('.pdf') ? 'View PDF Report' : 'View Investor Relations Page'}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {report.title}
                              {(report.url?.endsWith('.pdf') || report.pdfUrl?.endsWith('.pdf')) && (
                                <span className="ml-2 text-xs text-blue-600 font-normal">(PDF)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600">
                              {report.fiscalQuarter || `${report.quarter} ${report.year}`} • {format(parseISO(report.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Data from build: {format(parseISO(earningsData.lastUpdated), 'MMM dd, yyyy')}
        </p>
        {((earningsData as any).demo || (earningsData as any).static) && (
          <p className="text-sm text-amber-600 mt-1">
            Demo Mode: Showing sample portfolio companies
          </p>
        )}
      </div>
    </div>
  )
}