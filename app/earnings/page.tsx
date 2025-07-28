import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, FileText, ExternalLink } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Earnings Calendar & Reports | Rish Investing Journey",
  description: "Track upcoming earnings dates and access historical earnings reports for portfolio companies",
}

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
  quarter: string
  year: string
}

interface EarningsData {
  nextEarnings: EarningsDate[]
  historicalReports: Record<string, EarningsReport[]>
  lastUpdated: string
}

async function getEarningsData(): Promise<EarningsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/earnings`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch earnings data')
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching earnings data:', error)
    return {
      nextEarnings: [],
      historicalReports: {},
      lastUpdated: new Date().toISOString()
    }
  }
}

export default async function EarningsPage() {
  const earningsData = await getEarningsData()
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Earnings Calendar & Reports</h1>
      
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
                <div key={earning.symbol} className="flex items-center justify-between p-4 border rounded-lg">
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historical Earnings Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(earningsData.historicalReports).length === 0 ? (
            <p className="text-gray-500">No historical earnings reports found</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(earningsData.historicalReports).map(([symbol, reports]) => (
                <div key={symbol} className="border-b last:border-0 pb-6 last:pb-0">
                  <h3 className="font-semibold text-lg mb-3">{symbol}</h3>
                  <div className="space-y-2">
                    {reports.map((report, index) => (
                      <a
                        key={`${symbol}-${index}`}
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-gray-600">
                            {report.quarter} {report.year} • {format(parseISO(report.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        Last updated: {format(parseISO(earningsData.lastUpdated), 'MMM dd, yyyy HH:mm')}
      </p>
    </div>
  )
}