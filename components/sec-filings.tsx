"use client"

import { useState } from 'react'
import { FileText, Download, Calendar, Building2, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SECFiling {
  accessionNumber: string
  filingDate: string
  reportDate: string
  acceptanceDateTime: string
  act: string
  form: string
  fileNumber: string
  filmNumber: string
  items: string
  size: number
  isXBRL: number
  isInlineXBRL: number
  primaryDocument: string
  primaryDocDescription: string
}

interface CompanyInfo {
  name: string
  cik: string
  tickers: string[]
  sic: string
  sicDescription: string
  website: string
  investorWebsite: string
}

interface SECFilingsProps {
  filings: SECFiling[]
  company: CompanyInfo | null
  loading: boolean
  onSearch: (symbol: string, filingType: string) => void
}

export default function SECFilings({ filings, company, loading, onSearch }: SECFilingsProps) {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [filingTypeFilter, setFilingTypeFilter] = useState('10-Q,10-K')

  const handleSearch = () => {
    if (searchSymbol.trim()) {
      onSearch(searchSymbol.trim(), filingTypeFilter)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFormBadgeColor = (form: string) => {
    switch (form) {
      case '10-K': return 'bg-blue-100 text-blue-800'
      case '10-Q': return 'bg-green-100 text-green-800'
      case '8-K': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const generateSECUrl = (filing: SECFiling) => {
    if (!company?.cik || filing.accessionNumber.includes('demo')) {
      return '#'
    }
    
    const accessionNumber = filing.accessionNumber.replace(/-/g, '')
    return `https://www.sec.gov/Archives/edgar/data/${company.cik}/${accessionNumber}/${filing.primaryDocument}`
  }

  const downloadFiling = (filing: SECFiling) => {
    const url = generateSECUrl(filing)
    if (url !== '#') {
      window.open(url, '_blank')
    } else {
      alert('This is demo data. Real SEC filing URLs will be available with actual company data.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            SEC Earnings Reports
          </h2>
          <p className="text-gray-600 mt-1">Access 10-K annual and 10-Q quarterly earnings reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter stock symbol (e.g., AAPL)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-grow"
          />
          
          <Select value={filingTypeFilter} onValueChange={setFilingTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10-Q,10-K">Earnings Reports</SelectItem>
              <SelectItem value="10-K">Annual Reports (10-K)</SelectItem>
              <SelectItem value="10-Q">Quarterly Reports (10-Q)</SelectItem>
              <SelectItem value="8-K">Current Reports (8-K)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleSearch} disabled={loading} className="sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Company Information */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-gray-900 font-semibold">{company.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">CIK</label>
                <p className="text-gray-900 font-mono">{company.cik}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tickers</label>
                <p className="text-gray-900">
                  {company.tickers.length > 0 ? company.tickers.join(', ') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SIC</label>
                <p className="text-gray-900">{company.sic} - {company.sicDescription}</p>
              </div>
              {company.website && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {company.investorWebsite && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Investor Relations</label>
                  <a 
                    href={company.investorWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Investor Page
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filings List */}
      <div className="space-y-4">
        {filings.length > 0 ? (
          filings.map((filing, index) => (
            <Card key={`${filing.accessionNumber}-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getFormBadgeColor(filing.form)}>
                        {filing.form}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {filing.primaryDocDescription}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {filing.form === '10-K' ? 'Annual Report' : 
                       filing.form === '10-Q' ? 'Quarterly Report' : 
                       filing.form}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Filing Date</label>
                        <p className="text-gray-900 font-medium">{formatDate(filing.filingDate)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Report Date</label>
                        <p className="text-gray-900 font-medium">{formatDate(filing.reportDate)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">File Size</label>
                        <p className="text-gray-900 font-medium">{formatFileSize(filing.size)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Accession Number</label>
                        <p className="text-gray-900 font-mono text-xs">{filing.accessionNumber}</p>
                      </div>
                    </div>
                    
                    {filing.isXBRL === 1 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          XBRL Available
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-6">
                    <Button 
                      onClick={() => downloadFiling(filing)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                      View Report
                    </Button>
                    
                    {filing.isXBRL === 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const xbrlUrl = generateSECUrl(filing).replace('.htm', '_xbrl.xml')
                          if (xbrlUrl !== '#_xbrl.xml') {
                            window.open(xbrlUrl, '_blank')
                          }
                        }}
                      >
                        XBRL Data
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No filings found</h3>
              <p className="text-gray-600 mb-4">
                Enter a stock symbol above to search for SEC earnings reports.
              </p>
              <p className="text-sm text-gray-500">
                Note: This uses the SEC EDGAR database. Some symbols may require CIK numbers for accurate results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching SEC filings...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}