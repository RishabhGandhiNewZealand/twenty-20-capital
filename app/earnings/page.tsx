"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Download, TrendingUp } from 'lucide-react'
import EarningsCalendar from '@/components/earnings-calendar'
import SECFilings from '@/components/sec-filings'
import EarningsReleases from '@/components/earnings-releases'

interface EarningsEvent {
  date: string
  symbol: string
  company: string
  time?: string
  estimated_eps?: number
  actual_eps?: number
  source: string
}

interface SECFiling {
  accessionNumber: string
  filingDate: string
  reportDate: string
  acceptanceDateTime: string
  act: string
  form: string
  fileNumber: string
  filmNumber: string
  items: string
  size: number
  isXBRL: number
  isInlineXBRL: number
  primaryDocument: string
  primaryDocDescription: string
}

interface CompanyInfo {
  name: string
  cik: string
  tickers: string[]
  sic: string
  sicDescription: string
  website: string
  investorWebsite: string
}

interface EarningsRelease {
  title: string
  date: string
  quarter: string
  year: string
  url: string
  type: 'earnings_release' | 'press_release' | 'presentation'
  company: string
  symbol: string
  fileType: string
  source: string
}

export default function EarningsPage() {
  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<EarningsEvent[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)

  // SEC Filings state
  const [secFilings, setSecFilings] = useState<SECFiling[]>([])
  const [secCompany, setSecCompany] = useState<CompanyInfo | null>(null)
  const [secLoading, setSecLoading] = useState(false)

  // Earnings Releases state
  const [earningsReleases, setEarningsReleases] = useState<EarningsRelease[]>([])
  const [releasesLoading, setReleasesLoading] = useState(false)

  // Load default calendar data on mount
  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async (symbol?: string) => {
    setCalendarLoading(true)
    try {
      const params = new URLSearchParams()
      if (symbol) params.append('symbol', symbol)
      
      const response = await fetch(`/api/earnings-calendar?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setCalendarEvents(data.data)
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setCalendarLoading(false)
    }
  }

  const searchSECFilings = async (symbol: string, filingType: string) => {
    setSecLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('symbol', symbol)
      params.append('type', filingType)
      
      const response = await fetch(`/api/sec-filings?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSecFilings(data.filings)
        setSecCompany(data.company)
      }
    } catch (error) {
      console.error('Error searching SEC filings:', error)
    } finally {
      setSecLoading(false)
    }
  }

  const searchEarningsReleases = async (symbol: string, quarter?: string, year?: string) => {
    setReleasesLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('symbol', symbol)
      if (quarter) params.append('quarter', quarter)
      if (year) params.append('year', year)
      
      const response = await fetch(`/api/earnings-releases?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setEarningsReleases(data.data)
      }
    } catch (error) {
      console.error('Error searching earnings releases:', error)
    } finally {
      setReleasesLoading(false)
    }
  }

  const handleSymbolFilter = (symbol: string) => {
    // When a symbol is clicked in calendar, search for related data
    searchSECFilings(symbol, '10-Q,10-K')
    searchEarningsReleases(symbol)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings Center</h1>
              <p className="text-gray-600">
                Access earnings calendars, SEC filings, and company earnings releases
              </p>
            </div>
          </div>
          
          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Earnings Calendar</h3>
                    <p className="text-sm text-blue-700">Upcoming earnings announcements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">SEC Filings</h3>
                    <p className="text-sm text-green-700">Official 10-K and 10-Q reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Earnings Releases</h3>
                    <p className="text-sm text-purple-700">Direct company press releases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Earnings Calendar
            </TabsTrigger>
            <TabsTrigger value="releases" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Earnings Releases
            </TabsTrigger>
            <TabsTrigger value="sec-filings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SEC Filings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <EarningsCalendar
              events={calendarEvents}
              loading={calendarLoading}
              onRefresh={() => loadCalendarData()}
              onSymbolFilter={handleSymbolFilter}
            />
          </TabsContent>

          <TabsContent value="releases" className="space-y-6">
            <EarningsReleases
              releases={earningsReleases}
              loading={releasesLoading}
              onSearch={searchEarningsReleases}
            />
          </TabsContent>

          <TabsContent value="sec-filings" className="space-y-6">
            <SECFilings
              filings={secFilings}
              company={secCompany}
              loading={secLoading}
              onSearch={searchSECFilings}
            />
          </TabsContent>
        </Tabs>


      </div>
    </div>
  )
}