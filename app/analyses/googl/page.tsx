"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Search, AlertTriangle, Target, Loader2, Cloud, Smartphone, Brain } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function GoogleAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/GOOGL')
        
        if (response.ok) {
          const data: StockPrice = await response.json()
          setStockData({
            currentPrice: data.currentPrice,
            currency: data.currency,
            loading: false,
            error: undefined,
          })
        } else {
          const errorData: StockPriceError = await response.json()
          setStockData({
            loading: false,
            error: errorData.error,
          })
        }
      } catch (error) {
        setStockData({
          loading: false,
          error: 'Failed to fetch stock price',
        })
      }
    }

    fetchStockPrice()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">GOOGL</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Alphabet Inc.</h1>
                <p className="text-gray-600">NASDAQ: GOOGL • Technology • Search & Cloud Computing</p>
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Current Price Tile */}
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Current Price</CardTitle>
                </CardHeader>
                <CardContent>
                  {stockData.loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                  ) : stockData.error ? (
                    <div className="text-sm text-red-500">Price unavailable</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(stockData.currentPrice!, stockData.currency)} {stockData.currency}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Intrinsic Value Tile */}
              <Card className="border-blue-100 bg-blue-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Intrinsic Value</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">$200-220 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Search className="h-6 w-6 text-blue-500 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Digital Advertising Dominance</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Alphabet, Google's parent company, dominates the digital advertising landscape through its search engine, YouTube, and extensive ad network. Google Search maintains over 90% market share globally, making it the gateway to the internet for billions of users.
                </p>
                <p className="mb-4">
                  Beyond search, Google owns critical digital infrastructure including Android (the world's most popular mobile operating system), Chrome (the leading web browser), YouTube (the dominant video platform), and Google Cloud (the third-largest cloud provider). This ecosystem creates powerful network effects and data advantages.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Diversification</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  While advertising still represents the majority of revenue, Google Cloud is emerging as a significant growth driver, benefiting from the shift to cloud computing and AI workloads. YouTube has evolved into a major entertainment platform competing with traditional media and streaming services.
                </p>
                <p className="mb-4">
                  The company's "Other Bets" segment, while still unprofitable, includes potentially transformative businesses like Waymo (autonomous vehicles) and Verily (life sciences), providing optionality for future growth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Drivers */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Growth Drivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                AI Leadership
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Google's investments in AI research through DeepMind and Google Research have positioned it at the forefront of the AI revolution. The company's Gemini models and AI-powered search enhancements are maintaining its competitive edge against emerging threats.
                </p>
                <p className="mb-4">
                  AI is being integrated across all products, from search and ads to cloud services and productivity tools, creating new monetization opportunities and strengthening existing moats.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Cloud className="h-5 w-5 text-blue-600 mr-2" />
                Cloud Computing Growth
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Google Cloud is growing rapidly, with particular strength in data analytics, AI/ML services, and multi-cloud solutions. The business is approaching profitability while maintaining high growth rates, providing a second major earnings driver beyond advertising.
                </p>
                <p className="mb-4">
                  Enterprise adoption of Google Workspace continues to accelerate, creating sticky recurring revenue streams and deepening customer relationships that benefit the cloud business.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Dominant market share in search and digital advertising</li>
                  <li>• Massive data advantages from billions of users</li>
                  <li>• Control of key platforms (Android, Chrome, YouTube)</li>
                  <li>• World-class AI and engineering talent</li>
                  <li>• Strong balance sheet with $100B+ in cash</li>
                  <li>• Multiple growth vectors beyond core search</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Recent Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2024 Results</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Google delivered solid performance in 2024, with the stock appreciating from $140 to $184 USD, representing a 31.4% gain. The company continued to demonstrate resilience in its core advertising business while Cloud showed accelerating growth.
                </p>
                <p className="mb-4">
                  The position of 10 shares was maintained throughout the year at an average cost basis of $140 USD. Strong execution across all business segments validated the investment thesis.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategic Initiatives</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Management's focus on efficiency has resulted in improved operating margins despite continued investment in AI and cloud infrastructure. The company's disciplined approach to capital allocation, including substantial share buybacks, has enhanced shareholder returns.
                </p>
                <p className="mb-4">
                  Google's ability to defend its search moat while successfully expanding into new areas demonstrates the strength of its business model and execution capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Investment Strengths */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Investment Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">90%+ market share in search globally</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">YouTube's dominance in video and streaming</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Rapidly growing cloud business approaching profitability</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">AI leadership with Gemini and DeepMind</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strong free cash flow generation and capital returns</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Platform control with Android and Chrome</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Investment Risks */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Investment Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Regulatory scrutiny and antitrust actions globally</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">AI competition from OpenAI/Microsoft partnership</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Privacy regulations impacting ad targeting</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Market maturity in core search advertising</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Heavy capital requirements for AI infrastructure</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Alphabet represents a core technology holding with unmatched scale and reach in digital advertising. The company's dominant position in search, combined with YouTube's growth and emerging strength in cloud computing, provides multiple avenues for continued value creation.
              </p>
              <p className="mb-4">
                While regulatory challenges and AI disruption risks warrant monitoring, Google's massive data advantages, world-class engineering talent, and strong execution provide confidence in its ability to navigate these challenges. The company's investments in AI are already showing results in product improvements and new capabilities.
              </p>
              <p className="mb-4">
                Trading at a reasonable valuation relative to its growth and quality, Alphabet offers investors exposure to the ongoing digital transformation of the global economy with the safety of a highly profitable, cash-generative business model. The combination of defensive characteristics and growth optionality makes it a compelling long-term investment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}