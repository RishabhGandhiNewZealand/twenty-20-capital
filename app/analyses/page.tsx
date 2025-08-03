"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

interface Analysis {
  company: string
  symbol: string
  sector: string
  intrinsicValue: string
  href: string
  lastUpdated: string
  summary: string
  logo: string
  logoColor: string
  currentPrice?: number
  currency?: string
  loading?: boolean
  error?: string
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([
    {
      company: "Uber Technologies",
      symbol: "UBER",
      sector: "Transportation & Delivery",
      intrinsicValue: "$110",
      href: "/analyses/uber",
      lastUpdated: "December 4, 2024",
      summary: "Uber exhibits strong fundamental attributes with a significant competitive advantage built on 15+ years of data and network effects. The company has achieved critical scale leading to expanding profit margins, generating consistent cash flows despite facing challenges from autonomous vehicles and regulatory pressures.",
      logo: "UBER",
      logoColor: "bg-black",
      loading: true,
    },
    {
      company: "ASML Holding",
      symbol: "ASML",
      sector: "Technology Hardware",
      intrinsicValue: "$900",
      href: "/analyses/asml",
      lastUpdated: "March 15, 2025",
      summary: "ASML maintains a near-monopoly in EUV lithography with 90%+ market share, making it essential for advanced semiconductor manufacturing. The company's technological lead and robust demand from AI, automotive, and cloud computing positions it favorably for sustained growth despite cyclical industry pressures.",
      logo: "ASML",
      logoColor: "bg-blue-600",
      loading: true,
    },
    {
      company: "Mainfreight Limited",
      symbol: "MFT",
      sector: "Freight & Logistics",
      intrinsicValue: "$85-95 NZD",
      href: "/analyses/mft",
      lastUpdated: "December 2024",
      summary: "Mainfreight is a global freight forwarder with strong positions in ANZ markets. The company's self-funded international expansion strategy, unique corporate culture, and ability to gain market share during downturns create a compelling long-term investment opportunity.",
      logo: "MFT",
      logoColor: "bg-blue-900",
      loading: true,
    },
    {
      company: "Canadian Pacific Kansas City",
      symbol: "CP",
      sector: "Railroads",
      intrinsicValue: "$90-110",
      href: "/analyses/cp",
      lastUpdated: "December 2024",
      summary: "CPKC operates the only single-line rail network connecting Canada, US, and Mexico. The merger with Kansas City Southern creates unique strategic advantages with significant synergies yet to be realized, positioning the company for sustained growth.",
      logo: "CP",
      logoColor: "bg-red-600",
      loading: true,
    },
    {
      company: "Meta Platforms",
      symbol: "META",
      sector: "Social Media & Advertising",
      intrinsicValue: "$520-580",
      href: "/analyses/meta",
      lastUpdated: "December 2024",
      summary: "Meta's 3.29 billion daily active users across its platforms create powerful network effects. The company's untapped monetization potential in WhatsApp and Threads, combined with massive AI investments, provide multiple growth vectors beyond the core advertising business.",
      logo: "META",
      logoColor: "bg-blue-600",
      loading: true,
    },
    {
      company: "Salesforce",
      symbol: "CRM",
      sector: "Enterprise Software",
      intrinsicValue: "$280-320",
      href: "/analyses/crm",
      lastUpdated: "December 2024",
      summary: "Salesforce leads the CRM market with strong AI capabilities through Einstein platform. The company's renewed focus on profitability under new leadership, combined with high customer retention and comprehensive product suite, positions it well for sustained growth.",
      logo: "CRM",
      logoColor: "bg-blue-500",
      loading: true,
    },
    {
      company: "Mastercard",
      symbol: "MA",
      sector: "Payment Processing",
      intrinsicValue: "$490-530",
      href: "/analyses/ma",
      lastUpdated: "December 2024",
      summary: "Mastercard benefits from the secular shift from cash to digital payments with a duopoly market position. The company's asset-light model, exceptional margins, and expansion into new payment flows create a powerful formula for long-term value creation.",
      logo: "MA",
      logoColor: "bg-orange-600",
      loading: true,
    },
    {
      company: "MSCI Inc.",
      symbol: "MSCI",
      sector: "Financial Data & Analytics",
      intrinsicValue: "$600-650",
      href: "/analyses/msci",
      lastUpdated: "December 2024",
      summary: "MSCI provides essential infrastructure for $13+ trillion in indexed assets. The company benefits from passive investing trends, ESG data demand, and highly recurring revenue with 95%+ retention rates, positioning it as a high-quality compounder.",
      logo: "MSCI",
      logoColor: "bg-indigo-600",
      loading: true,
    },
    {
      company: "Amazon",
      symbol: "AMZN",
      sector: "E-commerce & Cloud",
      intrinsicValue: "$200-300",
      href: "/analyses/amzn",
      lastUpdated: "December 2024",
      summary: "Amazon dominates e-commerce and cloud computing with AWS. The company's high-margin advertising business growing 20%+ annually, combined with operational efficiency improvements under new leadership, creates multiple paths to value creation.",
      logo: "AMZN",
      logoColor: "bg-orange-500",
      loading: true,
    },
    {
      company: "Netflix",
      symbol: "NFLX",
      sector: "Streaming Entertainment",
      intrinsicValue: "$950-1100",
      href: "/analyses/nflx",
      lastUpdated: "December 2024",
      summary: "Netflix's scale advantages in content production and global reach create a sustainable moat. With potential to grow from 300M to 500M+ subscribers while raising prices and expanding into advertising, the company has a long runway for earnings growth.",
      logo: "NFLX",
      logoColor: "bg-red-600",
      loading: true,
    },
    {
      company: "S&P Global",
      symbol: "SPGI",
      sector: "Credit Ratings & Data",
      intrinsicValue: "$600-700",
      href: "/analyses/spgi",
      lastUpdated: "December 2024",
      summary: "S&P Global's duopoly position in credit ratings and expanded data capabilities from the IHS Markit merger create a powerful platform. The company's essential role in capital markets and high margins drive consistent value creation.",
      logo: "SPGI",
      logoColor: "bg-red-700",
      loading: true,
    },
    {
      company: "Alphabet",
      symbol: "GOOGL",
      sector: "Search & Cloud",
      intrinsicValue: "$200-220",
      href: "/analyses/googl",
      lastUpdated: "December 2024",
      summary: "Alphabet's 90%+ search market share and YouTube dominance provide defensive moats. Google Cloud's rapid growth and AI leadership through DeepMind create additional growth vectors beyond the core advertising business.",
      logo: "GOOGL",
      logoColor: "bg-blue-500",
      loading: true,
    },
  ])

  useEffect(() => {
    const fetchStockPrices = async () => {
      const updatedAnalyses = await Promise.all(
        analyses.map(async (analysis) => {
          try {
            const response = await fetch(`/api/stock-price/${analysis.symbol}`)
            
            if (response.ok) {
              const stockData: StockPrice = await response.json()
              return {
                ...analysis,
                currentPrice: stockData.currentPrice,
                currency: stockData.currency,
                loading: false,
                error: undefined,
              }
            } else {
              const errorData: StockPriceError = await response.json()
              return {
                ...analysis,
                loading: false,
                error: errorData.error,
              }
            }
          } catch (error) {
            return {
              ...analysis,
              loading: false,
              error: 'Failed to fetch stock price',
            }
          }
        })
      )
      
      setAnalyses(updatedAnalyses)
    }

    fetchStockPrices()
  }, [])

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Stock Analyses</h1>
          <p className="text-sm sm:text-base text-gray-600">In-depth fundamental analysis of portfolio companies</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {analyses.map((analysis) => (
            <Link key={analysis.href} href={analysis.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${analysis.logoColor} text-white flex items-center justify-center font-bold text-sm sm:text-base`}>
                        {analysis.logo}
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg text-gray-900">{analysis.company}</CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-500">
                          <span>{analysis.symbol}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{analysis.sector}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Intrinsic Value</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{analysis.intrinsicValue}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3">{analysis.summary}</p>
                  
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {analysis.lastUpdated}
                    </div>
                    <div className="text-right">
                      {analysis.loading ? (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Loading price...</span>
                        </div>
                      ) : analysis.error ? (
                        <span className="text-xs sm:text-sm text-red-600">{analysis.error}</span>
                      ) : analysis.currentPrice ? (
                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-base sm:text-lg font-semibold">
                            {analysis.currency === 'USD' ? '$' : analysis.currency === 'EUR' ? '€' : analysis.currency === 'NZD' ? 'NZ$' : '$'}
                            {analysis.currentPrice.toFixed(2)}
                          </p>
                          <p className={`text-xs sm:text-sm ${
                            analysis.currentPrice < parseFloat(analysis.intrinsicValue.replace(/[$€,NZ]/g, '').split('-')[0])
                              ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {((parseFloat(analysis.intrinsicValue.replace(/[$€,NZ]/g, '').split('-')[0]) / analysis.currentPrice - 1) * 100).toFixed(1)}% {
                              analysis.currentPrice < parseFloat(analysis.intrinsicValue.replace(/[$€,NZ]/g, '').split('-')[0])
                                ? 'undervalued' : 'premium'
                            }
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
