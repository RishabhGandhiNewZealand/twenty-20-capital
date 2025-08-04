"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, Calendar, Building2, AlertCircle, RefreshCw, TrendingUp, Link2, CheckCircle2, Clock, Database } from "lucide-react"
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
  cached?: boolean
  cache_timestamp?: string
}

interface CompanyStatus {
  name: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  data?: CompanyNews
  error?: string
}

interface CompaniesResponse {
  companies: string[]
  analysis_period: {
    start_date: string
    end_date: string
  }
  report_generated_date: string
}

export default function NewsPage() {
  const [companiesData, setCompaniesData] = useState<CompaniesResponse | null>(null)
  const [companyStatuses, setCompanyStatuses] = useState<CompanyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(false)

  // Fetch the list of companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/news/companies")
      if (!response.ok) {
        throw new Error("Failed to fetch companies")
      }
      
      const data = await response.json()
      setCompaniesData(data)
      
      // Initialize company statuses
      const statuses: CompanyStatus[] = data.companies.map((company: string) => ({
        name: company,
        status: 'pending'
      }))
      setCompanyStatuses(statuses)
      
    } catch (err) {
      console.error("Error fetching companies:", err)
      setError(err instanceof Error ? err.message : "Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch news for a single company
  const fetchCompanyNews = async (company: string, refresh: boolean = false): Promise<CompanyNews> => {
    const url = new URL(`/api/news/company`, window.location.origin)
    url.searchParams.append('company', company)
    if (refresh) {
      url.searchParams.append('refresh', 'true')
    }
    
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch news for ${company}`)
    }
    return response.json()
  }

  // Cache the news data
  const cacheNewsData = async (company: string, data: CompanyNews) => {
    if (!companiesData || data.error || data.cached) return
    
    try {
      const response = await fetch('/api/news/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company,
          startDate: companiesData.analysis_period.start_date,
          endDate: companiesData.analysis_period.end_date,
          data
        })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log(`Cached data for ${company}`)
      } else {
        console.log(`Cache update skipped for ${company}:`, result.message)
      }
    } catch (error) {
      console.error(`Failed to cache data for ${company}:`, error)
    }
  }

  // Analyze all companies one by one
  const analyzeAllCompanies = useCallback(async () => {
    if (!companiesData) return
    
    setIsAnalyzing(true)
    
    for (let i = 0; i < companiesData.companies.length; i++) {
      const company = companiesData.companies[i]
      
      // Update status to loading
      setCompanyStatuses(prev => prev.map((c, idx) => 
        idx === i ? { ...c, status: 'loading' } : c
      ))
      
      try {
        // Fetch news for this company
        const newsData = await fetchCompanyNews(company, forceRefresh)
        
        // Update with results
        setCompanyStatuses(prev => prev.map((c, idx) => 
          idx === i ? { 
            ...c, 
            status: 'completed',
            data: newsData
          } : c
        ))
        
        // Cache the data if it's not already cached
        if (!newsData.cached && !newsData.error) {
          await cacheNewsData(company, newsData)
        }
        
        // Small delay to avoid rate limits
        if (i < companiesData.companies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        console.error(`Error analyzing ${company}:`, error)
        
        // Update with error
        setCompanyStatuses(prev => prev.map((c, idx) => 
          idx === i ? { 
            ...c, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed'
          } : c
        ))
      }
    }
    
    setIsAnalyzing(false)
    setForceRefresh(false)
  }, [companiesData, forceRefresh])

  // Initial load
  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Start analysis when companies are loaded
  useEffect(() => {
    if (companiesData && companyStatuses.length > 0 && !isAnalyzing) {
      // Check if we need to start/resume analysis
      const hasIncomplete = companyStatuses.some(c => c.status === 'pending')
      if (hasIncomplete) {
        analyzeAllCompanies()
      }
    }
  }, [companiesData, companyStatuses, isAnalyzing, analyzeAllCompanies])

  // Refresh all
  const refreshAll = () => {
    fetchCompanies().then(() => {
      // fetchCompanies will reset statuses, which will trigger analyzeAllCompanies
    })
  }

  // Refresh all with force refresh
  const refreshAllForced = () => {
    setForceRefresh(true)
    fetchCompanies().then(() => {
      // fetchCompanies will reset statuses, which will trigger analyzeAllCompanies
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Loading portfolio companies...</p>
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
            <button
              onClick={refreshAll}
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

  // Calculate progress
  const completedCount = companyStatuses.filter(c => c.status === 'completed').length
  const errorCount = companyStatuses.filter(c => c.status === 'error').length
  const totalCount = companyStatuses.length
  const newsFoundCount = companyStatuses.filter(c => c.data?.status === 'news_found').length
  const cachedCount = companyStatuses.filter(c => c.data?.cached === true).length

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
        {companiesData && (
          <div className="mt-3 text-sm text-gray-500">
            <p>Report date: {(() => {
              try {
                const date = new Date(companiesData.report_generated_date)
                if (isNaN(date.getTime())) {
                  return companiesData.report_generated_date
                }
                return format(date, "MMMM d, yyyy")
              } catch {
                return companiesData.report_generated_date
              }
            })()}</p>
            <p>Analysis period: 30 days ({companiesData.analysis_period.start_date} to {companiesData.analysis_period.end_date})</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Analyzing companies... ({completedCount + errorCount}/{totalCount})
            </span>
            <span className="text-sm text-gray-500">
              {newsFoundCount} with news • {cachedCount} cached • {errorCount} errors
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((completedCount + errorCount) / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Company Cards */}
      <div className="space-y-6">
        {companyStatuses.map((companyStatus) => (
          <Card key={companyStatus.name} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {companyStatus.name}
                </div>
                <div className="flex items-center gap-2">
                  {companyStatus.data?.cached && (
                    <Database className="h-4 w-4 text-purple-600" title="Cached result" />
                  )}
                  {companyStatus.status === 'pending' && (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  {companyStatus.status === 'loading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {companyStatus.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {companyStatus.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                {companyStatus.status === 'pending' && "Waiting to analyze..."}
                {companyStatus.status === 'loading' && "Analyzing news and market trends..."}
                {companyStatus.status === 'error' && (
                  <span className="text-red-600">Analysis failed: {companyStatus.error}</span>
                )}
                {companyStatus.status === 'completed' && companyStatus.data && (
                  <>
                    {companyStatus.data.error ? (
                      <span className="text-amber-600">Analysis error - please try refreshing</span>
                    ) : companyStatus.data.status === "news_found" ? (
                      <>
                        {`${companyStatus.data.summary_points?.length || 0} key developments • ${companyStatus.data.references?.length || 0} sources`}
                        {companyStatus.data.cached && (
                          <span className="text-purple-600 ml-2">• From cache</span>
                        )}
                      </>
                    ) : (
                      <>
                        No significant developments in the analysis period
                        {companyStatus.data.cached && (
                          <span className="text-purple-600 ml-2">• From cache</span>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            
            {companyStatus.status === 'completed' && companyStatus.data?.status === "news_found" && (
              <CardContent className="pt-6 space-y-6">
                {/* Summary Points Section */}
                {Array.isArray(companyStatus.data.summary_points) && companyStatus.data.summary_points.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Developments & Analysis
                    </h3>
                    <div className="space-y-2">
                      {companyStatus.data.summary_points.map((point, index) => (
                        <p key={index} className="text-gray-800 leading-relaxed">
                          {point}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* References Section */}
                {Array.isArray(companyStatus.data.references) && companyStatus.data.references.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Sources & References
                    </h3>
                    <div className="space-y-2">
                      {companyStatus.data.references.map((ref, index) => (
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

      {/* Refresh Buttons */}
      {!isAnalyzing && companyStatuses.length > 0 && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={refreshAll}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </button>
          <button
            onClick={refreshAllForced}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Force Refresh (Skip Cache)
          </button>
        </div>
      )}
    </div>
  )
}