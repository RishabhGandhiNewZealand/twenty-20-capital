"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, BarChart3, AlertTriangle, Target, Loader2, Database, Globe, LineChart } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function MSCIAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/MSCI')
        
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
              <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">MSCI</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">MSCI Inc.</h1>
                <p className="text-gray-600">NYSE: MSCI • Financial Services • Index & Analytics Provider</p>
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
                  <div className="text-2xl font-bold text-blue-900">$600-650 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <BarChart3 className="h-6 w-6 text-indigo-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Essential Financial Data Infrastructure</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  MSCI is a leading financial data company that provides market indexes, ESG and Climate data, and other financial analytics. These data products are used by financial institutions globally for various purposes including indexed product creation (ETFs, mutual funds), performance benchmarking, portfolio construction, and rebalancing.
                </p>
                <p className="mb-4">
                  Without MSCI's products, many financial institutions would face significant challenges in accurately conducting critical parts of their business. The company has established itself as essential infrastructure for the global investment community, with its indexes serving as the foundation for over $13 trillion in assets.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Model</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  MSCI's products are typically consumed on two different bases: recurring subscriptions and asset-based fees. Recurring subscriptions are for ongoing risk assessment products and data analytics, while asset-based fees are collected as a percentage of assets under management using an MSCI product.
                </p>
                <p className="mb-4">
                  For example, if Vanguard provides an MSCI index ETF, they pay MSCI a small percentage for every dollar under management. Both revenue streams are highly consistent and recurring, providing exceptional revenue visibility and stability. Additionally, MSCI has established itself as a reputable brand with trusted data, which sustains demand for its products and acts as a competitive advantage.
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
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                Passive Investing Revolution
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The global expansion of passive investing and ETF markets continues to accelerate, with these products relying heavily on MSCI's indexes. This secular trend provides a steady stream of increasing asset-based fees as more investors shift from active to passive strategies.
                </p>
                <p className="mb-4">
                  As ETF assets grow globally, MSCI benefits directly through higher asset-based fees. The company's dominant position in emerging market and international equity indexes positions it particularly well to capture this growth.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 text-green-600 mr-2" />
                Data & Analytics Expansion
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The increasing importance of high-quality data for AI and machine learning applications in financial markets creates significant opportunities. MSCI is well-positioned to meet this demand with its comprehensive datasets and analytical tools.
                </p>
                <p className="mb-4">
                  MSCI's ability to innovate and offer new products tailored to evolving needs, such as ESG and climate data, demonstrates its capacity to expand beyond traditional index products. These new data categories command premium pricing and have high growth potential.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Trusted brand with decades of index methodology expertise</li>
                  <li>• High switching costs due to benchmark standardization</li>
                  <li>• Network effects as more assets track MSCI indexes</li>
                  <li>• Scalable business model with high incremental margins</li>
                  <li>• Recurring revenue model providing exceptional visibility</li>
                  <li>• First-mover advantage in ESG and climate data</li>
                </ul>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sustained Growth Potential</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  MSCI's growth prospects are supported by three main factors that indicate potential for sustained revenue growth in the coming years. The scalability of their business model will also enable further margin expansion, creating a powerful combination for shareholder value creation.
                </p>
                <p className="mb-4">
                  With both revenue growth and margin expansion working in tandem, MSCI is expected to grow free cash flow by 15%+ per year for an extended period. This makes it one of the highest-quality compounders in the financial services sector.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Performance</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Investment in MSCI began after identifying the company as a leading producer and distributor of financial data globally. Following comprehensive research, a partial position of 1.23 shares was initiated at an average price of $495 USD.
                </p>
                <p className="mb-4">
                  The stock appreciated rapidly before the position could be completed. Nevertheless, the company's fundamentals continue to improve each quarter, warranting additional investment during market dips over the upcoming year.
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
                  <span className="text-gray-700">Essential infrastructure for $13+ trillion in indexed assets</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Beneficiary of passive investing megatrend</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Highly recurring revenue with 95%+ retention rates</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Expanding margins due to scalable business model</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Leader in ESG and climate data analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strong pricing power for essential data products</span>
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
                  <span className="text-gray-700">Competition from other index providers (S&P, FTSE)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Regulatory changes affecting index licensing</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Market volatility impacting asset-based fees</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Customer concentration among large asset managers</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">High valuation requiring continued strong execution</span>
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
                MSCI represents a high-quality compounder in the financial data and analytics space. The company's essential role in the global investment ecosystem, combined with powerful secular trends like passive investing growth and increasing demand for ESG data, creates a compelling long-term investment opportunity.
              </p>
              <p className="mb-4">
                The business model's exceptional characteristics - high recurring revenue, strong pricing power, and significant operating leverage - enable MSCI to generate consistent free cash flow growth well above market rates. The company's expansion into new data categories provides additional growth vectors beyond traditional index products.
              </p>
              <p className="mb-4">
                While valuation remains elevated and competition exists, MSCI's trusted brand, high switching costs, and continuous innovation position it to maintain its leadership position. For investors seeking exposure to the financialization of markets and the growing importance of data in investment decisions, MSCI offers a best-in-class opportunity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}