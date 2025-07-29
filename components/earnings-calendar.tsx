"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, AlertCircle, Clock, CheckCircle, ExternalLink, FileText, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getLogoUrl } from "@/lib/company-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface Report {
  title: string
  date: string
  url: string
  type: 'quarterly' | 'annual'
}

interface InvestorReportsData {
  symbol: string
  investorRelationsUrl: string | null
  reports: {
    quarterly: Report[]
    annual: Report[]
  }
  message?: string
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<EarningsData | null>(null)
  const [investorReports, setInvestorReports] = useState<InvestorReportsData | null>(null)
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    fetchEarnings()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      fetchInvestorReports(selectedCompany.symbol)
    }
  }, [selectedCompany])

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

  const fetchInvestorReports = async (symbol: string) => {
    setLoadingReports(true)
    try {
      const response = await fetch(`/api/investor-reports?symbol=${symbol}`)
      const data = await response.json()
      setInvestorReports(data)
    } catch (error) {
      console.error('Error fetching investor reports:', error)
      setInvestorReports(null)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleCardClick = (earning: EarningsData) => {
    setSelectedCompany(earning)
  }

  const renderEarningsCard = (earning: EarningsData) => {
    const logoUrl = getLogoUrl(earning.symbol)
    
    // Determine which date to show
    let displayDate: Date | null = null
    let dateLabel = ""
    
    if (earning.hasReported && earning.lastEarningsDate) {
      displayDate = new Date(earning.lastEarningsDate)
      dateLabel = "Reported: "
    } else if (earning.nextEarningsDate) {
      displayDate = new Date(earning.nextEarningsDate)
      dateLabel = "Reports: "
    }
    
    // Special handling for Mainfreight (MFT)
    const isMainfreight = earning.symbol === 'MFT' || earning.symbol === 'MFT.NZ'
    const reportingFrequency = isMainfreight ? 'Half-Yearly' : 'Quarterly'
    
    return (
      <Card 
        key={earning.symbol} 
        className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
        onClick={() => handleCardClick(earning)}
      >
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
            {displayDate ? (
              <div className="flex items-center text-sm">
                {earning.hasReported ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                )}
                <span className={earning.hasReported ? "text-gray-600" : ""}>
                  {dateLabel}
                  {format(displayDate, 'MMM d, yyyy')}
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

  const renderReportsList = (reports: Report[], type: 'quarterly' | 'annual') => {
    if (reports.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {type} reports available
        </div>
      )
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {reports.map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{report.title}</p>
                  <p className="text-xs text-gray-500">{format(new Date(report.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={report.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
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
  const noDateEarnings = earnings.filter(e => !e.hasReported && !e.nextEarningsDate && !e.lastEarningsDate)

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Companies Earnings</CardTitle>
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

      {/* Expanded View Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getLogoUrl(selectedCompany.symbol)}
                      alt={`${selectedCompany.name} logo`}
                      className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCompany.symbol}&background=0D9488&color=fff&size=40`
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
                      <p className="text-sm text-gray-600">{selectedCompany.symbol}</p>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : investorReports ? (
                  <div className="space-y-4">
                    {investorReports.investorRelationsUrl && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Investor Relations Page</span>
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={investorReports.investorRelationsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Visit IR Page
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    )}

                    <Tabs defaultValue="quarterly" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="quarterly">
                          Quarterly Reports ({investorReports.reports.quarterly.length})
                        </TabsTrigger>
                        <TabsTrigger value="annual">
                          Annual Reports ({investorReports.reports.annual.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="quarterly" className="mt-4">
                        {renderReportsList(investorReports.reports.quarterly, 'quarterly')}
                      </TabsContent>
                      
                      <TabsContent value="annual" className="mt-4">
                        {renderReportsList(investorReports.reports.annual, 'annual')}
                      </TabsContent>
                    </Tabs>

                    {investorReports.message && (
                      <p className="text-sm text-gray-500 text-center mt-4">
                        {investorReports.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Unable to load investor reports
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}