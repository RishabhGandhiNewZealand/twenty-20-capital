"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, isAfter, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns"
import { getLogoUrl } from "@/lib/company-utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EarningsData {
  symbol: string
  name: string
  nextEarningsDate: string | null
  lastEarningsDate: string | null
  estimatedEPS?: number
  actualEPS?: number
  isActive: boolean
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Get earnings for a specific date
  const getEarningsForDate = (date: Date) => {
    return earnings.filter(e => {
      if (!e.nextEarningsDate) return false
      const earningsDate = new Date(e.nextEarningsDate)
      return isSameDay(earningsDate, date)
    })
  }

  // Get upcoming earnings (next 30 days)
  const upcomingEarnings = earnings.filter(e => {
    if (!e.nextEarningsDate) return false
    const earningsDate = new Date(e.nextEarningsDate)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return isAfter(earningsDate, now) && isBefore(earningsDate, thirtyDaysFromNow)
  })

  // Get past earnings (companies without upcoming earnings)
  const pastEarnings = earnings.filter(e => !e.nextEarningsDate || isBefore(new Date(e.nextEarningsDate), new Date()))

  // Calendar generation
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get the first day of the week for the month
  const startDay = getDay(monthStart)
  
  // Add empty cells for days before month starts
  const emptyDays = Array(startDay).fill(null)

  const renderCalendarDay = (date: Date | null, index: number) => {
    if (!date) return <div key={`empty-${index}`} className="h-24" />
    
    const dayEarnings = getEarningsForDate(date)
    const isToday = isSameDay(date, new Date())
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    
    return (
      <div
        key={date.toISOString()}
        onClick={() => setSelectedDate(date)}
        className={`h-24 border rounded-lg p-2 cursor-pointer transition-all ${
          isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
          dayEarnings.length > 0 ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
        }`}
      >
        <div className="font-semibold text-sm mb-1">{format(date, 'd')}</div>
        {dayEarnings.length > 0 && (
          <div className="space-y-1">
            {dayEarnings.slice(0, 2).map(e => (
              <div key={e.symbol} className="text-xs truncate">
                <Badge variant={e.isActive ? "default" : "secondary"} className="w-full justify-start">
                  {e.symbol}
                </Badge>
              </div>
            ))}
            {dayEarnings.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEarnings.length - 2} more</div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderEarningsCard = (earning: EarningsData) => {
    const logoUrl = getLogoUrl(earning.symbol)
    const earningsDate = earning.nextEarningsDate ? new Date(earning.nextEarningsDate) : null
    
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
              </div>
            </div>
            <Badge variant={earning.isActive ? "default" : "secondary"}>
              {earning.isActive ? "Active" : "Exited"}
            </Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            {earningsDate ? (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>{format(earningsDate, 'MMM d, yyyy')}</span>
                <span className="ml-2 text-gray-500">
                  ({Math.ceil((earningsDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                </span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>No upcoming earnings</span>
              </div>
            )}
            
            {earning.estimatedEPS !== undefined && (
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span>Est. EPS: ${earning.estimatedEPS?.toFixed(2) || 'N/A'}</span>
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingEarnings.length})</TabsTrigger>
          <TabsTrigger value="all">All Companies ({earnings.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Earnings Calendar</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, index) => renderCalendarDay(null, index))}
                {monthDays.map((date) => renderCalendarDay(date, date.getDate()))}
              </div>
            </CardContent>
          </Card>
          
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Earnings on {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEarningsForDate(selectedDate).length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {getEarningsForDate(selectedDate).map(earning => renderEarningsCard(earning))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No earnings scheduled for this date</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Earnings (Next 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEarnings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEarnings.map(earning => renderEarningsCard(earning))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming earnings in the next 30 days</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Portfolio Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {earnings.map(earning => renderEarningsCard(earning))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}