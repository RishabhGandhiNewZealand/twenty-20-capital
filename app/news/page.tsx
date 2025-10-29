"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedCompanyNews, setSelectedCompanyNews] = useState<CompanyNews | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFetchingNews, setIsFetchingNews] = useState(false)

  // Helper function to extract symbol from company name
  const extractSymbol = (companyName: string): string | null => {
    const match = companyName.match(/\(([^)]+)\)$/)
    return match ? match[1] : null
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
      
      // Automatically select the first company if available
      if (data.companies.length > 0) {
      }
      
      // No default selection
      setSelectedCompany(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [])

  // New function to fetch news for the selected company
  const fetchNewsForSelectedCompany = useCallback(async (companyName: string, forceRefetch: boolean = false) => {
    if (!companyName) {
      setSelectedCompanyNews(null)
      return
    }

    setIsFetchingNews(true)
    setError(null)
    setSelectedCompanyNews(null) // Clear previous news

    // Check if existing news is stale (older than 7 days) unless forceRefetch is true
    if (!forceRefetch && selectedCompanyNews && selectedCompanyNews.company_name === companyName) {
      try {
        const reportDate = new Date(companiesData?.report_generated_date || selectedCompanyNews.report_generated_date || '');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (reportDate < sevenDaysAgo) {
          console.log(`News for ${companyName} is older than 7 days. Forcing refetch.`);
          // Proceed with fetch, effectively forcing a refetch
        } else {
          // News is still fresh, no need to refetch
          setSelectedCompanyNews(selectedCompanyNews);
          setIsFetchingNews(false);
          return;
        }
      } catch (dateError) {
        console.error("Error parsing report date for staleness check:", dateError);
        // If date parsing fails, assume stale and proceed with fetch
      }
    }

    try {
      const response = await fetch(`/api/news/company?company=${encodeURIComponent(companyName)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch news for ${companyName}`)
      }

      const data = await response.json()
      setSelectedCompanyNews(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load news for ${companyName}`)
      setSelectedCompanyNews({
        company_name: companyName,
        status: 'no_significant_news_found',
        summary_points: [],
        references: [],
        error: err instanceof Error ? err.message : 'Failed to load news',
      })
    } finally {
      setIsFetchingNews(false)
    }
  }, [])

  // Effect to fetch news when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      fetchNewsForSelectedCompany(selectedCompany)
    }
  }, [selectedCompany, fetchNewsForSelectedCompany])


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

      {/* Company Selection Dropdown */}
      <div className="mb-6 flex items-center gap-2">
        <label htmlFor="company-select" className="text-gray-700 font-medium">Select Company:</label>
        <Select
          onValueChange={setSelectedCompany}
          value={selectedCompany || ""}
          disabled={isFetchingNews || loading || !companiesData?.companies.length}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Companies</SelectLabel>
              {companiesData?.companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isFetchingNews && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching news...</span>
          </div>
        )}
      </div>

      {/* Display News for Selected Company */}
      {selectedCompany && (
        <div className="space-y-6">
          {selectedCompanyNews ? (
            <CompanyNewsCard
              companyNews={selectedCompanyNews}
              extractSymbol={extractSymbol}
              companyNameOnly={selectedCompanyNews.company_name.replace(/\s*\([^)]*\)$/, '')}
            />
          ) : (
            isFetchingNews ? (
              <Card className="animate-pulse">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading news for {selectedCompany}...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Please wait while we fetch the latest developments.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-5 w-5" />
                    No News Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-600">Select a company from the dropdown to view its news.</p>
                  <Button
                    onClick={() => fetchNewsForSelectedCompany(selectedCompany, true)}
                    className="mt-4"
                  >
                    Refresh News
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  )
}

interface CompanyNewsCardProps {
  companyNews: CompanyNews;
  extractSymbol: (companyName: string) => string | null;
  companyNameOnly: string;
}

const CompanyNewsCard = ({ companyNews, extractSymbol, companyNameOnly }: CompanyNewsCardProps) => {
  const symbol = extractSymbol(companyNews.company_name);
  const hasNews = companyNews.status === 'news_found';

  return (
    <Card
      key={companyNews.company_name}
      id={`company-card-${companyNews.company_name}`}
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
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            {!symbol && <Building2 className="h-5 w-5 text-blue-600" />}
            <span>{companyNameOnly}</span>
            {symbol && <span className="text-sm text-gray-500">({symbol})</span>}
          </div>
          <div className="flex items-center gap-2">
            {hasNews && companyNews.references && companyNews.references.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <FileText className="h-4 w-4 mr-1" />
                    {companyNews.references.length} Sources
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Sources & References</SheetTitle>
                    <SheetDescription>
                      {companyNameOnly} - {companyNews.references.length} sources
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {companyNews.references.map((ref, index) => (
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
          </div>
        </CardTitle>
        <CardDescription>
          {companyNews.status === 'news_found' && (
            `${companyNews.summary_points?.length || 0} key developments • ${companyNews.references?.length || 0} sources`
          )}
          {companyNews.status === 'no_significant_news_found' && companyNews.error && (
            <span className="text-red-600">Analysis failed: {companyNews.error}</span>
          )}
          {companyNews.status === 'no_significant_news_found' && !companyNews.error && (
            "No significant developments in the analysis period"
          )}
        </CardDescription>
      </CardHeader>

      {hasNews && (
        <CardContent className="pt-6">
          {Array.isArray(companyNews.summary_points) && companyNews.summary_points.length > 0 && (
            <div className="space-y-2">
              {companyNews.summary_points.map((point, index) => (
                <p key={index} className="text-gray-800 leading-relaxed">
                  {point}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};