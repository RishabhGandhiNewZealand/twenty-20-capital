"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, Calendar, Building2, AlertCircle, TrendingUp, Link2, CheckCircle2, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { getLogoUrl } from "@/lib/company-utils"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

interface NewsResponse {
  report_generated_date: string
  analysis_period: {
    start_date: string
    end_date: string
  }
  company_news: CompanyNews[]
}

export default function NewsPage() {
  const [companiesData, setCompaniesData] = useState<CompaniesResponse | null>(null)
  const [companyStatuses, setCompanyStatuses] = useState<CompanyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  // Helper function to extract symbol from company name
  const extractSymbol = (companyName: string): string | null => {
    const match = companyName.match(/\(([^)]+)\)$/)
    return match ? match[1] : null
  }

  // Toggle company expansion
  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set<string>()
      // If clicking on an already expanded company, collapse it
      if (prev.has(companyName)) {
        return newSet // Return empty set
      } else {
        // Otherwise, expand only this company
        newSet.add(companyName)
        // Auto-scroll to the expanded card after a short delay
        setTimeout(() => {
          const element = document.getElementById(`company-card-${companyName}`)
          if (element) {
            const yOffset = -80 // Offset for fixed header
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
          }
        }, 100)
        return newSet
      }
    })
  }

  // Fetch companies list
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/news/companies")
      
      if (!response.ok) {
        throw new Error("Failed to load companies")
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
      setError(err instanceof Error ? err.message : "Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch all news at once from the cached endpoint
  const analyzeAllCompanies = useCallback(async () => {
    if (!companiesData) return
    
    setIsAnalyzing(true)
    
    try {
      // Update all statuses to loading
      setCompanyStatuses(prev => prev.map(c => ({ ...c, status: 'loading' })))
      
      // Fetch all news at once from the cached endpoint
      const response = await fetch("/api/news")
      
      if (!response.ok) {
        throw new Error("Failed to fetch news data")
      }
      
      const newsData: NewsResponse = await response.json()
      
      // Update all company statuses with the results
      setCompanyStatuses(prev => prev.map(company => {
        const newsItem = newsData.company_news.find(
          news => news.company_name === company.name
        )
        
        if (newsItem) {
          return {
            ...company,
            status: 'completed',
            data: newsItem
          }
        } else {
          return {
            ...company,
            status: 'error',
            error: 'No data received'
          }
        }
      }))
      
    } catch (error) {
      // Update all statuses to error
      setCompanyStatuses(prev => prev.map(c => ({ 
        ...c, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to analyze news'
      })))
    } finally {
      setIsAnalyzing(false)
    }
  }, [companiesData])

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
            <p className="text-red-700">{error}</p>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio News</h1>
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
              {newsFoundCount} with news • {errorCount} errors
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

      {/* Company Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {companyStatuses.map((companyStatus) => {
          const symbol = extractSymbol(companyStatus.name)
          const companyNameOnly = companyStatus.name.replace(/\s*\([^)]*\)$/, '')
          const isExpanded = expandedCompanies.has(companyStatus.name)
          const hasNews = companyStatus.status === 'completed' && companyStatus.data?.status === "news_found"
          
          return (
            <button
              key={companyStatus.name}
              onClick={() => toggleCompany(companyStatus.name)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                "flex flex-col items-center justify-center min-h-[96px]",
                isExpanded && "ring-2 ring-blue-500 border-blue-500",
                !isExpanded && hasNews && "border-green-200 bg-green-50 hover:border-green-300",
                !isExpanded && companyStatus.status === 'completed' && !hasNews && "border-gray-200 bg-gray-50 hover:border-gray-300",
                !isExpanded && companyStatus.status === 'loading' && "border-blue-200 bg-blue-50",
                !isExpanded && companyStatus.status === 'error' && "border-red-200 bg-red-50",
                !isExpanded && companyStatus.status === 'pending' && "border-gray-200 bg-gray-50"
              )}
            >
              {/* Company Logo */}
              {symbol && (
                <div className="relative w-10 h-10 bg-white rounded-lg shadow-sm overflow-hidden mb-1">
                  <Image
                    src={getLogoUrl(symbol)}
                    alt={`${symbol} logo`}
                    width={40}
                    height={40}
                    className="object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}
              {!symbol && <Building2 className="h-6 w-6 text-gray-400 mb-1" />}
              
              {/* Company Name */}
              <div className="text-center">
                <div className="font-medium text-xs leading-tight">{companyNameOnly}</div>
                {symbol && <div className="text-xs text-gray-500">{symbol}</div>}
              </div>
              
              {/* Status Indicator */}
              <div className="absolute top-1 right-1">
                {companyStatus.status === 'pending' && (
                  <Clock className="h-3 w-3 text-gray-400" />
                )}
                {companyStatus.status === 'loading' && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                )}
                {companyStatus.status === 'completed' && hasNews && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
                {companyStatus.status === 'completed' && !hasNews && (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-400" />
                )}
                {companyStatus.status === 'error' && (
                  <AlertCircle className="h-3 w-3 text-red-600" />
                )}
              </div>
              
              {/* Expand/Collapse Indicator */}
              <div className="absolute bottom-1 right-1">
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </div>
              
              {/* News Count Badge */}
              {hasNews && companyStatus.data && (
                <div className="absolute bottom-1 left-1 text-xs text-gray-600">
                  {companyStatus.data.summary_points?.length || 0}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Expanded Company Cards */}
      <div className="space-y-6">
        {companyStatuses.filter(cs => expandedCompanies.has(cs.name)).map((companyStatus) => {
          const symbol = extractSymbol(companyStatus.name)
          const companyNameOnly = companyStatus.name.replace(/\s*\([^)]*\)$/, '')
          
          return (
            <Card 
              key={companyStatus.name} 
              id={`company-card-${companyStatus.name}`}
              className="overflow-hidden animate-in slide-in-from-top-2 duration-300"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lg">
                    {symbol && (
                      <div className="relative w-10 h-10 bg-white rounded-lg shadow-sm overflow-hidden">
                        <Image
                          src={getLogoUrl(symbol)}
                          alt={`${symbol} logo`}
                          width={40}
                          height={40}
                          className="object-contain p-1"
                          onError={(e) => {
                            // Fallback to Building2 icon if logo fails to load
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden absolute inset-0 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    )}
                    {!symbol && <Building2 className="h-5 w-5 text-blue-600" />}
                    <span>{companyNameOnly}</span>
                    {symbol && <span className="text-sm text-gray-500">({symbol})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {companyStatus.status === 'completed' && companyStatus.data?.status === "news_found" && 
                     companyStatus.data?.references && 
                     companyStatus.data.references.length > 0 && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <FileText className="h-4 w-4 mr-1" />
                            {companyStatus.data.references.length} Sources
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                          <SheetHeader>
                            <SheetTitle>Sources & References</SheetTitle>
                            <SheetDescription>
                              {companyNameOnly} - {companyStatus.data.references.length} sources
                            </SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {companyStatus.data.references.map((ref, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 pb-3 border-b last:border-0"
                              >
                                <span className="text-gray-500 font-medium text-sm mt-1 min-w-[24px]">
                                  [{index + 1}]
                                </span>
                                <div className="flex-1">
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 font-medium"
                                  >
                                    {ref.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
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
                                        <span className="text-amber-600 text-xs font-medium">Indirect</span>
                                      </>
                                    )}
                                    {ref.relevance === "direct" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600 text-xs font-medium">Direct</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCompany(companyStatus.name)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {companyStatus.status === 'pending' && "Waiting to analyze..."}
                  {companyStatus.status === 'loading' && "Analyzing news and market trends..."}
                  {companyStatus.status === 'error' && (
                    <span className="text-red-600">Analysis failed: {companyStatus.error}</span>
                  )}
                  {companyStatus.status === 'completed' && companyStatus.data && (
                    companyStatus.data.error ? (
                      <span className="text-amber-600">Analysis error - please try refreshing</span>
                    ) : companyStatus.data.status === "news_found" ? (
                      `${companyStatus.data.summary_points?.length || 0} key developments • ${companyStatus.data.references?.length || 0} sources`
                    ) : (
                      "No significant developments in the analysis period"
                    )
                  )}
                </CardDescription>
              </CardHeader>
              
              {companyStatus.status === 'completed' && companyStatus.data?.status === "news_found" && (
                <CardContent className="pt-6">
                  {/* Summary Points Section - Removed heading */}
                  {Array.isArray(companyStatus.data.summary_points) && companyStatus.data.summary_points.length > 0 && (
                    <div className="space-y-2">
                      {companyStatus.data.summary_points.map((point, index) => (
                        <p key={index} className="text-gray-800 leading-relaxed">
                          {point}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}