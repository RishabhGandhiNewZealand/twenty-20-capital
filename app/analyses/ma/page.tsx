"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, CreditCard, AlertTriangle, Target, Loader2, Globe, Shield, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function MastercardAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/MA')
        
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
              <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">MA</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mastercard Incorporated</h1>
                <p className="text-gray-600">NYSE: MA • Financial Services • Payment Processing</p>
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
                  <div className="text-2xl font-bold text-blue-900">$490-530 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <CreditCard className="h-6 w-6 text-orange-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Payment Network</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mastercard operates one of the world's largest payment processing networks, facilitating transactions between consumers, merchants, financial institutions, and governments across more than 210 countries and territories. The company doesn't issue cards or extend credit but instead provides the technology and network that enables electronic payments.
                </p>
                <p className="mb-4">
                  As a pure-play payment processor, Mastercard earns revenue by charging fees based on transaction volumes and cross-border activities. This asset-light model generates exceptional margins and returns on capital, as the company doesn't bear credit risk or require significant physical infrastructure.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Network Effects & Scale</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mastercard benefits from powerful two-sided network effects - the more cardholders use Mastercard, the more valuable it becomes to merchants, and vice versa. With billions of cards in circulation and acceptance at tens of millions of merchant locations worldwide, the network's scale creates formidable barriers to entry.
                </p>
                <p className="mb-4">
                  The company processes over 100 billion transactions annually, with each additional transaction having minimal incremental cost. This scalability allows Mastercard to achieve operating margins exceeding 50%, among the highest in the financial services industry.
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
                Secular Shift to Digital Payments
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The global transition from cash to electronic payments continues to accelerate, driven by e-commerce growth, contactless payment adoption, and government digitization initiatives. Despite decades of growth, cash still represents approximately 80% of global consumer transactions, providing a massive runway for continued expansion.
                </p>
                <p className="mb-4">
                  Emerging markets present particularly attractive opportunities, as rising middle classes, smartphone penetration, and financial inclusion efforts drive rapid adoption of electronic payments. Mastercard's investments in these regions position it to capture disproportionate growth.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                Innovation & New Payment Flows
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Beyond traditional card payments, Mastercard is expanding into new payment flows including account-to-account transfers, real-time payments, and business-to-business transactions. These initiatives significantly expand the company's addressable market beyond consumer payments.
                </p>
                <p className="mb-4">
                  The company's investments in cybersecurity, fraud prevention, data analytics, and open banking solutions create additional revenue streams while strengthening relationships with financial institution partners. These value-added services command premium pricing and increase customer stickiness.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Duopoly market structure with Visa providing rational competition</li>
                  <li>• Massive scale and network effects creating high barriers to entry</li>
                  <li>• Asset-light model with minimal capital requirements</li>
                  <li>• Trusted global brand with regulatory approvals worldwide</li>
                  <li>• Technology leadership in security and payment innovation</li>
                  <li>• Diversified revenue streams across geographies and payment types</li>
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
                  Mastercard delivered exceptional performance in 2024, with the stock appreciating from $450 to $548 USD, representing a 22% gain. The company continued to benefit from robust consumer spending, cross-border travel recovery, and market share gains in key regions.
                </p>
                <p className="mb-4">
                  The position was maintained throughout the year with 4 shares at an average cost basis of $450 USD. Strong fundamentals and consistent execution validated the long-term investment thesis.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Highlights</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Revenue growth remained in the low double-digits, driven by healthy consumer spending and continued cash displacement. Cross-border volumes showed particular strength as international travel normalized. The company maintained its industry-leading operating margins while investing in growth initiatives.
                </p>
                <p className="mb-4">
                  Management's capital allocation remains exemplary, with substantial share buybacks and dividend growth funded by robust free cash flow generation. The company's balance sheet remains pristine with minimal debt.
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
                  <span className="text-gray-700">Duopoly market position with rational competition</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Secular growth from cash to digital payment transition</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Exceptional margins and returns on capital</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strong network effects and scale advantages</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Expansion into new payment flows and services</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Shareholder-friendly capital allocation</span>
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
                  <span className="text-gray-700">Regulatory scrutiny on interchange fees</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Competition from alternative payment methods</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Economic sensitivity to consumer spending</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Technological disruption from fintech companies</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Geopolitical impacts on cross-border volumes</span>
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
                Mastercard represents a core holding for long-term investors seeking exposure to the secular shift from cash to digital payments. The company's duopoly position, powerful network effects, and asset-light model create one of the best business models in the financial services industry.
              </p>
              <p className="mb-4">
                With cash still representing the vast majority of global transactions, Mastercard has decades of growth ahead as electronic payments continue to gain share. The company's expansion into new payment flows and value-added services provides additional growth vectors beyond traditional card payments.
              </p>
              <p className="mb-4">
                While regulatory risks and competition from alternative payment methods warrant monitoring, Mastercard's scale advantages, trusted brand, and continuous innovation position it to remain a dominant force in the evolving payments landscape. The combination of steady growth, exceptional profitability, and shareholder-friendly capital allocation makes Mastercard a compelling long-term investment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}