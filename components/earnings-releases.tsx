"use client"

import { useState } from 'react'
import { FileText, Download, Calendar, Building2, ExternalLink, Search, FileCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

interface EarningsReleasesProps {
  releases: EarningsRelease[]
  loading: boolean
  onSearch: (symbol: string, quarter?: string, year?: string) => void
}

export default function EarningsReleases({ releases, loading, onSearch }: EarningsReleasesProps) {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [quarterFilter, setQuarterFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('2024')

  const handleSearch = () => {
    if (searchSymbol.trim()) {
      const quarter = quarterFilter === 'all' ? undefined : quarterFilter
      onSearch(searchSymbol.trim(), quarter, yearFilter)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'earnings_release': return 'bg-blue-100 text-blue-800'
      case 'press_release': return 'bg-green-100 text-green-800'
      case 'presentation': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'PDF': return <FileText className="h-4 w-4 text-red-600" />
      case 'PPTX':
      case 'PPT': return <FileCheck className="h-4 w-4 text-orange-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const downloadRelease = (release: EarningsRelease) => {
    // For real URLs, open directly. For demo URLs, show info
    if (release.url.includes('example-')) {
      alert(`This is demo data. The real URL pattern for ${release.symbol} would be: ${release.url}`)
    } else {
      // Try to open the URL - if it's a real company URL, it should work
      window.open(release.url, '_blank')
    }
  }

  const isQuarterAvailable = (releaseDate: string) => {
    const date = new Date(releaseDate)
    const now = new Date()
    return date <= now
  }

  const filteredReleases = releases.filter(release => {
    if (quarterFilter === 'all') return true
    return release.quarter === quarterFilter
  })

  // Known companies with real earnings release patterns
  const knownCompanies = ['MA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA']

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Earnings Releases
          </h2>
          <p className="text-gray-600 mt-1">Direct access to company earnings releases and press releases</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter stock symbol (e.g., MA, AAPL)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-grow"
          />
          
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleSearch} disabled={loading} className="sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Info about supported companies */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Supported Companies</h3>
          <p className="text-sm text-blue-800 mb-2">
            Direct earnings release access for: <strong>MA (Mastercard)</strong>, <strong>AAPL (Apple)</strong>, <strong>MSFT (Microsoft)</strong>, <strong>GOOGL (Alphabet)</strong>, <strong>TSLA (Tesla)</strong>
          </p>
          <p className="text-xs text-blue-700">
            Other symbols will show demo data with URL patterns that could be used for scraping investor relations pages.
          </p>
        </div>
      </div>

      {/* Releases List */}
      <div className="space-y-4">
        {filteredReleases.length > 0 ? (
          filteredReleases.map((release, index) => (
            <Card key={`${release.symbol}-${release.quarter}-${release.year}-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getTypeBadgeColor(release.type)}>
                        {release.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {release.quarter} {release.year}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getFileTypeIcon(release.fileType)}
                        <span className="text-sm text-gray-500">{release.fileType}</span>
                      </div>
                      {knownCompanies.includes(release.symbol) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Real URL
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {release.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <label className="text-gray-500">Company</label>
                        <p className="text-gray-900 font-medium">{release.company}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Release Date</label>
                        <p className="text-gray-900 font-medium">{formatDate(release.date)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Source</label>
                        <p className="text-gray-900 font-medium">{release.source}</p>
                      </div>
                    </div>

                    {/* URL Preview for transparency */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Document URL</label>
                      <p className="text-sm text-gray-700 font-mono break-all">{release.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-6">
                    <Button 
                      onClick={() => downloadRelease(release)}
                      className="flex items-center gap-2"
                      size="sm"
                      disabled={!isQuarterAvailable(release.date) && !knownCompanies.includes(release.symbol)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    {knownCompanies.includes(release.symbol) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const baseUrl = release.url.split('/files/')[0]
                          window.open(baseUrl, '_blank')
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        IR Page
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : !loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No earnings releases found</h3>
              <p className="text-gray-600 mb-4">
                Enter a stock symbol above to search for earnings releases.
              </p>
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Try these examples:</strong></p>
                <div className="flex flex-wrap justify-center gap-2">
                  {knownCompanies.map(symbol => (
                    <Button
                      key={symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchSymbol(symbol)
                        onSearch(symbol, undefined, yearFilter)
                      }}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for earnings releases...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Usage Notes */}
      {releases.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">💡 How this works</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• <strong>Real URLs:</strong> For supported companies (MA, AAPL, etc.), these are actual download links to earnings releases</p>
              <p>• <strong>Demo Data:</strong> Other companies show predicted URL patterns based on common investor relations structures</p>
              <p>• <strong>Next Steps:</strong> To fully automate this, you could implement web scraping of investor relations pages or use paid financial data APIs</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}