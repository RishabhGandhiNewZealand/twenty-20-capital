"use client"

import { useState, useEffect } from 'react'
import { Calendar, Clock, TrendingUp, Building2, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EarningsEvent {
  date: string
  symbol: string
  company: string
  time?: string
  estimated_eps?: number
  actual_eps?: number
  source: string
}

interface EarningsCalendarProps {
  events: EarningsEvent[]
  loading: boolean
  onRefresh: () => void
  onSymbolFilter: (symbol: string) => void
}

export default function EarningsCalendar({ events, loading, onRefresh, onSymbolFilter }: EarningsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {} as Record<string, EarningsEvent[]>)

  // Filter events
  const filteredEvents = events.filter(event => {
    const symbolMatch = !symbolFilter || event.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
    const timeMatch = timeFilter === 'all' || 
      (timeFilter === 'before' && event.time?.toLowerCase().includes('before')) ||
      (timeFilter === 'after' && event.time?.toLowerCase().includes('after'))
    return symbolMatch && timeMatch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeColor = (time?: string) => {
    if (!time) return 'default'
    if (time.toLowerCase().includes('before')) return 'blue'
    if (time.toLowerCase().includes('after')) return 'green'
    return 'default'
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const isPast = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString < today
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Earnings Calendar
          </h2>
          <p className="text-gray-600 mt-1">Upcoming earnings announcements</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            placeholder="Filter by symbol..."
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="before">Before Market</SelectItem>
              <SelectItem value="after">After Market</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid gap-4">
        {Object.entries(eventsByDate)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, dayEvents]) => {
            const filteredDayEvents = dayEvents.filter(event => {
              const symbolMatch = !symbolFilter || event.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
              const timeMatch = timeFilter === 'all' || 
                (timeFilter === 'before' && event.time?.toLowerCase().includes('before')) ||
                (timeFilter === 'after' && event.time?.toLowerCase().includes('after'))
              return symbolMatch && timeMatch
            })

            if (filteredDayEvents.length === 0) return null

            return (
              <Card 
                key={date} 
                className={`${isToday(date) ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${isPast(date) ? 'opacity-75' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(date)}
                      {isToday(date) && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Today
                        </Badge>
                      )}
                    </CardTitle>
                    <Badge variant="outline">
                      {filteredDayEvents.length} event{filteredDayEvents.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-3">
                    {filteredDayEvents.map((event, index) => (
                      <div 
                        key={`${event.symbol}-${index}`}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onSymbolFilter(event.symbol)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{event.symbol}</span>
                              {event.time && (
                                <Badge variant={getTimeColor(event.time) as any}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {event.time}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{event.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-right">
                          {event.estimated_eps && (
                            <div className="text-sm">
                              <div className="text-gray-500">Est. EPS</div>
                              <div className="font-semibold text-green-600">
                                ${event.estimated_eps.toFixed(2)}
                              </div>
                            </div>
                          )}
                          
                          {event.actual_eps && (
                            <div className="text-sm">
                              <div className="text-gray-500">Actual EPS</div>
                              <div className={`font-semibold ${
                                event.actual_eps >= (event.estimated_eps || 0) ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${event.actual_eps.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No earnings events found</h3>
            <p className="text-gray-600 mb-4">
              {symbolFilter || timeFilter !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'No upcoming earnings events available.'}
            </p>
            <Button onClick={onRefresh} variant="outline">
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}