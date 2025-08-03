"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, BarChart2, AlertTriangle, Target, Loader2, Building, Shield, LineChart } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function SPGIAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/SPGI')
        
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
              <div className="w-16 h-16 bg-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SPGI</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">S&P Global Inc.</h1>
                <p className="text-gray-600">NYSE: SPGI • Financial Services • Credit Ratings & Market Intelligence</p>
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
                  <div className="text-2xl font-bold text-blue-900">$600-700 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Building className="h-6 w-6 text-red-700 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Essential Financial Infrastructure</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  S&P Global is a leading provider of transparent and independent ratings, benchmarks, analytics, and data to the capital and commodity markets worldwide. The company operates through four main segments: Ratings, Market Intelligence, Commodity Insights (formerly Platts), and Indices.
                </p>
                <p className="mb-4">
                  The Ratings division, which generates the highest margins, provides credit ratings that are essential for debt issuance globally. Market Intelligence offers data, research, and analytics to investment professionals. Commodity Insights provides pricing benchmarks for energy and commodities markets. The Indices division licenses the iconic S&P 500 and other benchmarks.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Moat</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  S&P Global benefits from powerful network effects and regulatory requirements that create substantial barriers to entry. Their credit ratings are embedded in countless investment mandates, regulatory frameworks, and financial contracts, making them extremely difficult to displace.
                </p>
                <p className="mb-4">
                  The company's data and analytics become more valuable as they accumulate more historical information and users, creating a self-reinforcing competitive advantage. This positions S&P Global as an essential part of the global financial infrastructure.
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
                <LineChart className="h-5 w-5 text-blue-600 mr-2" />
                Secular Growth Trends
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  S&P Global is positioned to benefit from several long-term trends including the growth of global debt markets, increasing regulatory requirements for transparency, the shift to passive investing (benefiting the Indices business), and growing demand for ESG and climate data.
                </p>
                <p className="mb-4">
                  The company's recent merger with IHS Markit has significantly expanded its data and analytics capabilities, creating cross-selling opportunities and operational synergies that should drive margin expansion over the coming years.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                Resilient Business Model
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The subscription-based revenue model across most divisions provides exceptional revenue visibility and stability. Even the more cyclical Ratings business benefits from the essential nature of credit ratings in global capital markets.
                </p>
                <p className="mb-4">
                  S&P Global's ability to raise prices consistently, combined with high incremental margins on new revenue, creates a powerful formula for sustained earnings growth. The company's capital-light model generates substantial free cash flow for reinvestment and shareholder returns.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Duopoly position with Moody's in credit ratings</li>
                  <li>• Regulatory moat and embedded use in financial contracts</li>
                  <li>• Network effects in data and analytics businesses</li>
                  <li>• Trusted brand with 150+ year history</li>
                  <li>• High switching costs for customers</li>
                  <li>• Synergies from IHS Markit merger</li>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Investment Journey</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The position in S&P Global was maintained throughout 2024 with 5 shares at an average cost basis of $495 USD. The company has delivered solid performance as expected, with the stock appreciating modestly while continuing to execute on integration synergies.
                </p>
                <p className="mb-4">
                  Recent developments include the upgrade of Uber's debt to investment grade, which surpassed management's expectations. This demonstrates the value and influence of S&P's ratings in the market.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Excellence</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  S&P Global continues to demonstrate operational excellence with expanding margins as merger synergies are realized. The company's diverse revenue streams provide resilience during market volatility while maintaining strong growth in key areas like ESG data and indices.
                </p>
                <p className="mb-4">
                  Management's focus on technology investments and product innovation ensures S&P Global remains at the forefront of financial data and analytics, positioning it well for continued market share gains.
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
                  <span className="text-gray-700">Duopoly position in essential credit ratings</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Diversified revenue streams across financial data</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">High margins and strong free cash flow generation</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Synergies from IHS Markit merger</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Regulatory moat and high switching costs</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Growing demand for ESG and alternative data</span>
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
                  <span className="text-gray-700">Regulatory scrutiny on credit rating agencies</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Cyclical exposure to debt issuance volumes</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Integration risks from large merger</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Competition in data and analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Reputational risk from rating failures</span>
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
                S&P Global represents a high-quality investment in essential financial infrastructure. The company's dominant position in credit ratings, combined with its expanded data and analytics capabilities following the IHS Markit merger, creates a powerful platform for sustained growth.
              </p>
              <p className="mb-4">
                The business model's attractive characteristics - high margins, strong free cash flow generation, and pricing power - are underpinned by regulatory requirements and network effects that create substantial barriers to entry. These advantages should enable S&P Global to compound value for shareholders over the long term.
              </p>
              <p className="mb-4">
                While regulatory risks and cyclical exposure to debt markets warrant monitoring, S&P Global's diversified revenue streams, essential role in capital markets, and ongoing merger synergies position it well for continued outperformance. For investors seeking exposure to the growing financialization of the global economy, S&P Global offers a compelling risk-reward profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}