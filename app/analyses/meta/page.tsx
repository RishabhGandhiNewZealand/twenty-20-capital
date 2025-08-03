"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, AlertTriangle, Target, Loader2, Network, Smartphone, Brain, Globe } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function MetaAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/META')
        
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
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">META</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meta Platforms Inc.</h1>
                <p className="text-gray-600">NASDAQ: META • Technology • Social Media & Advertising</p>
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
                  <div className="text-2xl font-bold text-blue-900">$520-580 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Network className="h-6 w-6 text-blue-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">World's Largest Social Media Empire</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Meta is the world's largest social media and advertising company, enabling better communication through Facebook, Messenger, Instagram, WhatsApp, and Threads. Combined, these apps have 3.29 billion daily active users, representing nearly half of the world's population with internet access.
                </p>
                <p className="mb-4">
                  Meta's growth is driven by powerful network effects, making their platforms essential for users who wish to stay connected with friends and family. This creates a self-reinforcing cycle where more users attract more users, strengthening Meta's dominant position in social media.
                </p>
              </div>
            </div>

            {/* Meta's Family of Apps Image */}
            <div className="my-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Meta's Family of Apps</h4>
              <div className="relative h-64 mb-4">
                <Image
                  src="/META.png"
                  alt="Meta's Family of Apps"
                  fill
                  className="object-contain rounded-lg border border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-600 italic text-center">
                Meta's Family of Apps. Most people use at least 1 of these every day.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Model</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Meta generates revenue primarily through advertising, currently making $46 per user on their platform per year. The company's massive user base and sophisticated targeting capabilities make it one of the most effective advertising platforms globally, attracting businesses of all sizes.
                </p>
                <p className="mb-4">
                  While the company has likely reached the limit on the number of ad impressions per person, the heightened demand for ad space allows Meta to raise prices above inflation. This is due to the finite time users can spend on any application, making that time increasingly valuable for advertisers.
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
                <Users className="h-5 w-5 text-green-600 mr-2" />
                User Growth & Engagement
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Meta continues to expand its already massive user base with the launch of Threads, which has captured market share from X (formerly Twitter). With 100 million daily active users on Threads, Meta is poised for further growth across its platform ecosystem.
                </p>
                <p className="mb-4">
                  The company's strong network effects and global population increase are expected to drive ~4% annual user growth over the next decade. As Meta's user base grows, it becomes increasingly attractive to advertisers, which in turn boosts demand for ad space.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Smartphone className="h-5 w-5 text-purple-600 mr-2" />
                Monetization Opportunities
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Further monetization of WhatsApp and Threads presents significant growth opportunities. WhatsApp, with over 2 billion users, remains largely unmonetized, offering substantial revenue potential through business messaging and payments.
                </p>
                <p className="mb-4">
                  AI-driven engagement tools will enhance both user and advertiser experience, improving ad targeting and relevance while keeping users more engaged with the platforms. This creates a win-win situation that drives higher revenue per user.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-2" />
                AI and Future Computing Platforms
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Meta is heavily investing in Reality Labs and AI infrastructure. By building advanced compute and networking capabilities, Meta aims to develop world-class AI models and open source them to democratize AI access.
                </p>
                <p className="mb-4">
                  VR and AR technologies are being developed as potential future computing platforms, bolstered by natural language AI. While there's no guarantee these investments will pay off, if successful, Meta could become the most valuable company in the world by defining the next computing paradigm.
                </p>
                <p className="mb-4">
                  Current valuations only consider future expenditure and exclude potential revenue from Reality Labs and AI due to uncertainty, providing potential upside if these bets succeed.
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2024 Investment Journey</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Investment in Meta was initiated after observing increased personal usage and ad frequency on Facebook, suggesting broader user engagement trends. Despite a good earnings report, the stock dropped 15%, likely due to slower daily active user growth and increased Capex forecasts for 2024 and 2025.
                </p>
                <p className="mb-4">
                  However, the fundamentals remained sound. The position was increased to 3.2812 shares at an average of $450 USD each. The stock rose to around $585 USD by year-end, validating the investment thesis.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Highlights</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Meta now comprises ~9% of the portfolio, demonstrating strong performance with the stock appreciating from $450 to $585, a gain of 30%. The company continues to deliver strong financial results with growing revenue per user and expanding margins.
                </p>
                <p className="mb-4">
                  The market's initial concern about increased capital expenditure has been overshadowed by Meta's ability to generate substantial cash flows and the potential long-term benefits of AI and infrastructure investments.
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
                  <span className="text-gray-700">3.29 billion daily active users across platforms</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Powerful network effects creating high barriers to entry</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Pricing power in advertising due to finite user attention</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Untapped monetization potential in WhatsApp and Threads</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Leading AI infrastructure and open-source initiatives</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Potential to define next computing platform with VR/AR</span>
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
                  <span className="text-gray-700">Regulatory scrutiny and potential antitrust actions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Privacy concerns and data protection regulations</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Heavy capital expenditure on unproven technologies</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Competition from emerging social platforms</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Dependence on advertising revenue model</span>
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
                Meta represents a compelling investment opportunity in the digital advertising and social media space. With 3.29 billion daily active users and growing, the company's network effects create an almost impenetrable moat that continues to strengthen over time.
              </p>
              <p className="mb-4">
                The company's ability to monetize user attention through sophisticated advertising technology, combined with significant untapped potential in WhatsApp and Threads, provides a clear path for continued revenue growth. Additionally, Meta's massive investments in AI and future computing platforms offer optionality that could dramatically increase the company's value.
              </p>
              <p className="mb-4">
                While regulatory risks and heavy capital expenditure on unproven technologies present challenges, Meta's core business remains exceptionally strong. For investors who believe in the continued importance of social connectivity and digital advertising, Meta offers exposure to both current cash flows and potentially transformative future technologies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}