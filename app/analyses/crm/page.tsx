"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Cloud, AlertTriangle, Target, Loader2, Building2, Zap, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function SalesforceAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/CRM')
        
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
                <span className="text-white font-bold text-xl">CRM</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Salesforce Inc.</h1>
                <p className="text-gray-600">NYSE: CRM • Technology • Customer Relationship Management</p>
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
                  <div className="text-2xl font-bold text-blue-900">$280-320 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Cloud className="h-6 w-6 text-blue-500 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">CRM Market Leader</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Salesforce is the leading provider of customer relationship management (CRM) software, enabling businesses to manage their interactions with customers and prospects effectively. The company's cloud-based platform helps organizations streamline sales, marketing, customer service, and commerce operations.
                </p>
                <p className="mb-4">
                  With a comprehensive suite of products including Sales Cloud, Service Cloud, Marketing Cloud, and Commerce Cloud, Salesforce serves businesses of all sizes across various industries. The platform's flexibility and extensive ecosystem of third-party applications make it the go-to solution for companies looking to digitize their customer engagement processes.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Ecosystem</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Salesforce has built a powerful ecosystem around its platform, including AppExchange, which hosts thousands of third-party applications that extend the platform's functionality. This ecosystem creates significant switching costs for customers and provides additional revenue opportunities through partnerships and integrations.
                </p>
                <p className="mb-4">
                  The company's acquisition strategy has been instrumental in expanding its capabilities, with notable acquisitions including Tableau (data visualization), MuleSoft (integration), and Slack (workplace collaboration), each adding strategic value to the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Thesis */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Investment Thesis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                AI-Driven Growth
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Salesforce is well-positioned to benefit from the AI revolution with its Einstein AI platform and the recently introduced Einstein GPT. These AI capabilities are being integrated across all products, enabling customers to automate workflows, generate insights, and improve productivity.
                </p>
                <p className="mb-4">
                  The company's focus on AI-driven innovation should help maintain its competitive edge and justify premium pricing, as customers increasingly seek intelligent automation solutions to enhance their operations.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 text-green-600 mr-2" />
                Operational Efficiency
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Under new leadership, Salesforce has shifted focus towards profitability and operational efficiency. The company has implemented cost-cutting measures, reduced workforce, and improved sales productivity, leading to expanding margins.
                </p>
                <p className="mb-4">
                  This renewed focus on profitability, combined with the company's strong market position and recurring revenue model, positions Salesforce for sustainable long-term growth with improving cash flow generation.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Market-leading position in CRM with significant scale advantages</li>
                  <li>• High switching costs due to deep integration with customer operations</li>
                  <li>• Comprehensive product suite covering all aspects of customer engagement</li>
                  <li>• Strong ecosystem with thousands of third-party applications</li>
                  <li>• Recurring subscription revenue model with high retention rates</li>
                  <li>• Strategic acquisitions enhancing platform capabilities</li>
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
                  Salesforce delivered strong performance in 2024, with the stock appreciating from $250 to $334 USD, representing a 33.6% gain. The company benefited from its renewed focus on profitability and the market's recognition of its AI potential.
                </p>
                <p className="mb-4">
                  The position was initiated at an average cost basis of $250 USD, with 7 shares held by year-end. The investment thesis was validated by improving operational metrics and strong execution under new leadership.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Highlights</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The company has successfully balanced growth with profitability, demonstrating that it can expand margins while continuing to invest in product innovation. Customer retention remains strong, and the adoption of new AI features is driving increased usage and revenue per customer.
                </p>
                <p className="mb-4">
                  Management's commitment to operational excellence and shareholder returns has been well-received by the market, with the company initiating its first dividend and continuing share buybacks.
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
                  <span className="text-gray-700">Market leader in CRM with dominant market share</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strong AI capabilities with Einstein platform</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Improving operational efficiency and margins</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">High customer retention and switching costs</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Comprehensive product suite and ecosystem</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Recurring revenue model with predictable cash flows</span>
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
                  <span className="text-gray-700">Intense competition from Microsoft, Oracle, and others</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Integration challenges from multiple acquisitions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Dependence on enterprise IT spending cycles</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">High valuation requiring continued execution</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Potential disruption from new AI-native competitors</span>
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
                Salesforce represents a compelling investment in the enterprise software space, combining market leadership in CRM with significant AI-driven growth potential. The company's renewed focus on profitability under new leadership has transformed it from a growth-at-any-cost story to a balanced growth and profitability narrative.
              </p>
              <p className="mb-4">
                With its dominant market position, high switching costs, and comprehensive product suite, Salesforce is well-positioned to benefit from the ongoing digital transformation of businesses worldwide. The integration of AI capabilities across the platform provides additional growth drivers and competitive differentiation.
              </p>
              <p className="mb-4">
                While competition remains intense and valuation requires continued strong execution, Salesforce's combination of market leadership, operational improvements, and AI innovation makes it an attractive long-term investment for those seeking exposure to enterprise software and the AI revolution.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}