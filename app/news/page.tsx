"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, Calendar, Building2, AlertCircle, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface NewsItem {
  summary: string
  source_name: string
  url: string
  publication_date: string
}

interface CompanyNews {
  company_name: string
  status: "news_found" | "no_significant_news_found"
  news_items: NewsItem[]
}

interface NewsResponse {
  report_generated_date: string
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
          <p className="text-lg text-gray-600">Retrieving latest news...</p>
          <p className="text-sm text-gray-500">Analyzing portfolio companies with AI</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio News</h1>
        <p className="text-gray-600">
          AI-powered news analysis for portfolio companies
        </p>
        {newsData && (
          <p className="text-sm text-gray-500 mt-2">
            Report generated: {format(new Date(newsData.report_generated_date), "MMMM d, yyyy")}
          </p>
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
              Refresh News
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing news for {newsData.company_news.length} companies 
            ({companiesWithNews.length} with recent news)
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
                    {company.status === "news_found"
                      ? `${company.news_items.length} recent news ${company.news_items.length === 1 ? "item" : "items"} found (showing up to 3)`
                      : "No significant news found in the past 14 days"}
                  </CardDescription>
                </CardHeader>
                
                {company.status === "news_found" && company.news_items.length > 0 && (
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {company.news_items.map((news, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-200 pl-4 py-2 hover:border-blue-400 transition-colors"
                        >
                          <p className="text-gray-800 mb-2">{news.summary}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(news.publication_date), "MMM d, yyyy")}
                            </span>
                            <span className="font-medium">{news.source_name}</span>
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Read more
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
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
              Refresh News
            </button>
          </div>
        </>
      )}
    </div>
  )
}