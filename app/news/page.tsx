"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, Calendar, Building2, AlertCircle, RefreshCw, TrendingUp, Link2 } from "lucide-react"
import { format } from "date-fns"

interface Reference {
  title: string
  source_name: string
  url: string
  publication_date: string
  relevance: "direct" | "indirect"
}

interface CompanyNews {
  company_name: string
  status: "news_found" | "no_significant_news_found"
  summary_points: string[]
  references: Reference[]
  error?: string
}

interface NewsResponse {
  report_generated_date: string
  analysis_period: {
    start_date: string
    end_date: string
  }
  company_news: CompanyNews[]
}

export default function NewsPage() {
  const [newsData, setNewsData] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Fetching news from API...")
      const response = await fetch("/api/news")
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        console.error("Error details:", errorData.details)
        console.error("Model used:", errorData.modelUsed)
        throw new Error(errorData.error || "Failed to fetch news")
      }
      
      const data = await response.json()
      console.log("News data received:", data)
      console.log("Number of companies:", data.company_news?.length || 0)
      
      setNewsData(data)
    } catch (err) {
      console.error("Error fetching news:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Analyzing market news and trends...</p>
          <p className="text-sm text-gray-500">Gathering comprehensive insights for your portfolio</p>
          <p className="text-xs text-gray-400 mt-2">This may take a minute as we analyze each company individually</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-2">{error}</p>
            <p className="text-sm text-red-600">
              Please ensure GEMINI_API_KEY is configured in your environment variables.
            </p>
            <button
              onClick={fetchNews}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if we have valid news data
  const hasCompanies = newsData?.company_news && newsData.company_news.length > 0
  const companiesWithNews = newsData?.company_news.filter(c => c.status === "news_found") || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio News Analysis</h1>
        <p className="text-gray-600">
          Comprehensive market intelligence for your portfolio companies
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Including industry trends and market events that may impact your investments
        </p>
        {newsData && (
          <div className="mt-3 text-sm text-gray-500">
                          <p>Report generated: {(() => {
                try {
                  const date = new Date(newsData.report_generated_date)
                  if (isNaN(date.getTime())) {
                    return newsData.report_generated_date
                  }
                  return format(date, "MMMM d, yyyy")
                } catch {
                  return newsData.report_generated_date
                }
              })()}</p>
            <p>Analysis period: {(() => {
              try {
                const start = new Date(newsData.analysis_period.start_date)
                const end = new Date(newsData.analysis_period.end_date)
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                  return `${newsData.analysis_period.start_date} - ${newsData.analysis_period.end_date}`
                }
                return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
              } catch {
                return `${newsData.analysis_period.start_date} - ${newsData.analysis_period.end_date}`
              }
            })()}</p>
          </div>
        )}
      </div>

      {!hasCompanies ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-gray-500 mb-4">No company news data available.</p>
            <button
              onClick={fetchNews}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Analysis
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Analyzing {newsData.company_news.length} companies • {companiesWithNews.length} with significant developments
            {newsData.company_news.some(c => c.error) && (
              <span className="text-amber-600 ml-2">
                • Some companies had analysis errors
              </span>
            )}
          </div>
          
          <div className="space-y-6">
            {newsData.company_news.map((company) => (
              <Card key={company.company_name} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {company.company_name}
                  </CardTitle>
                  <CardDescription>
                    {company.error ? (
                      <span className="text-amber-600">Analysis error - please try refreshing</span>
                    ) : company.status === "news_found" ? (
                      `${company.summary_points?.length || 0} key developments • ${company.references?.length || 0} sources`
                    ) : (
                      "No significant developments in the analysis period"
                    )}
                  </CardDescription>
                </CardHeader>
                
                {company.status === "news_found" && (
                  <CardContent className="pt-6 space-y-6">
                    {/* Summary Points Section */}
                    {Array.isArray(company.summary_points) && company.summary_points.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Key Developments & Analysis
                        </h3>
                        <div className="space-y-2">
                          {company.summary_points.map((point, index) => (
                            <p key={index} className="text-gray-800 leading-relaxed">
                              {point}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* References Section */}
                    {Array.isArray(company.references) && company.references.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Sources & References
                        </h3>
                        <div className="space-y-2">
                          {company.references.map((ref, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-gray-400 mt-0.5">
                                {ref.relevance === "indirect" ? "○" : "●"}
                              </span>
                              <div className="flex-1">
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                                >
                                  {ref.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
                                  <span>{ref.source_name}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {(() => {
                                      try {
                                        const date = new Date(ref.publication_date)
                                        if (isNaN(date.getTime())) {
                                          return ref.publication_date || 'Date unavailable'
                                        }
                                        return format(date, "MMM d, yyyy")
                                      } catch {
                                        return ref.publication_date || 'Date unavailable'
                                      }
                                    })()}
                                  </span>
                                  {ref.relevance === "indirect" && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-600">Industry/Market Impact</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={fetchNews}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Analysis
            </button>
          </div>
        </>
      )}
    </div>
  )
}