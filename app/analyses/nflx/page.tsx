"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Tv, AlertTriangle, Target, Loader2, Globe, PlayCircle, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function NetflixAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/NFLX')
        
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
              <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">NFLX</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Netflix Inc.</h1>
                <p className="text-gray-600">NASDAQ: NFLX • Technology • Streaming Entertainment</p>
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
                  <div className="text-2xl font-bold text-blue-900">$950-1100 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Tv className="h-6 w-6 text-red-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Streaming Entertainment Pioneer</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Netflix is an online streaming service that produces, buys and licenses content to stream to 300 million+ users worldwide. It really is a simple business to understand. They charge a monthly fee which is far below the price of a cable tv subscription and offer multiple tiers of subscription to suit customers' needs.
                </p>
                <p className="mb-4">
                  They produce a wealth of content (arguably of varying quality) but with such breadth that everyone is bound to find something they like. Moreover, as Netflix's scale has grown it has become more attractive to other media companies as a licensing destination. Their moat is their scale - their platform is very efficient to run, and they can produce more content than anyone else at a cheaper cost.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantage</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  This scale advantage means that if people can only choose one subscription, they will pick Netflix because it has the widest variety of content available. The company's ability to amortize content costs across a massive global subscriber base creates a sustainable competitive advantage that's difficult for competitors to replicate.
                </p>
                <p className="mb-4">
                  Netflix's recommendation algorithm, built on years of viewing data from hundreds of millions of users, helps surface relevant content and increase engagement, further strengthening the value proposition for subscribers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Strategy */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Growth Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                Global Expansion
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Netflix has massive growth potential with only 282M users currently. This can grow to 500M+ over the next 10 years as they expand globally and continue to take share from legacy cable media. The company's investment in local content production has been key to winning in international markets.
                </p>
                <p className="mb-4">
                  In established markets, they can raise prices by 5-8% per year without significant churn as the alternative is paying $70+ for a monthly cable tv subscription, which doesn't have the same wealth of on-demand content.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <PlayCircle className="h-5 w-5 text-green-600 mr-2" />
                New Revenue Streams
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Netflix is expanding into other adjacencies such as gaming and sports. They recently streamed the NFL on their platform, which further increases the value proposition and user retention. These initiatives help differentiate Netflix from competitors and justify premium pricing.
                </p>
                <p className="mb-4">
                  Netflix has introduced ads into their platform, and with such a captive audience, this ad space is very valuable. By offering the ad tier as a discounted subscription, they lower the barrier to use the Netflix platform which increases customer acquisition while potentially generating higher revenue per user than ad-free tiers.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operating Leverage</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Crucially, Netflix can achieve all this growth without significantly increasing their cost base as the infrastructure and content can support more users without a large increase in investment. This operating leverage is what makes the Netflix investment story so compelling.
                </p>
                <p className="mb-4">
                  All these factors provide a massive growth path for Netflix's earnings, with the company transitioning from a growth-at-any-cost model to one focused on profitability and cash flow generation.
                </p>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Investment Thesis Validation</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  A position in Netflix was started after realizing that even at its "high" valuation, the market is still severely undervaluing the company given its prospects. 2 shares were purchased across the year with an average price of $769 USD.
                </p>
                <p className="mb-4">
                  The stock has performed exceptionally well, validating the thesis that Netflix's combination of scale advantages, pricing power, and new growth initiatives would drive strong returns. The company continues to exceed expectations on subscriber growth and profitability.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Future Outlook</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Netflix remains attractively valued at current levels given its growth runway. The company's ability to raise prices, expand internationally, and monetize through advertising while maintaining its content advantage positions it for continued outperformance.
                </p>
                <p className="mb-4">
                  With streaming still in the early stages of displacing traditional television globally, Netflix's best days are likely still ahead.
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
                  <span className="text-gray-700">Global streaming leader with 300M+ subscribers</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Scale advantages in content production and distribution</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Pricing power with 5-8% annual increases</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Expanding into gaming, sports, and advertising</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Operating leverage driving margin expansion</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Long runway with potential for 500M+ subscribers</span>
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
                  <span className="text-gray-700">Intense competition from Disney+, HBO Max, and others</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Content costs inflation and production challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Market saturation in developed countries</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Password sharing crackdown impact on growth</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Economic sensitivity affecting discretionary spending</span>
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
                Netflix represents a compelling investment opportunity in the global shift from linear television to streaming entertainment. The company's scale advantages, combined with its ability to produce and distribute content more efficiently than competitors, create a sustainable moat that should drive continued market share gains.
              </p>
              <p className="mb-4">
                The investment story is straightforward yet powerful - Netflix can grow subscribers to 500M+ while raising prices annually, expanding into new revenue streams, and leveraging its fixed cost base. This combination should drive exceptional earnings growth over the next decade.
              </p>
              <p className="mb-4">
                While competition remains fierce and content costs continue to rise, Netflix's proven execution, global reach, and evolving business model position it to remain the dominant force in streaming entertainment. For investors seeking exposure to the future of media consumption, Netflix offers an attractive risk-reward profile at current valuations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}