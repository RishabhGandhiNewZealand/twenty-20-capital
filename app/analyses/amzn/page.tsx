"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Cloud, AlertTriangle, Target, Loader2, ShoppingCart, Server, Tv } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function AmazonAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/AMZN')
        
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
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AMZN</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Amazon.com Inc.</h1>
                <p className="text-gray-600">NASDAQ: AMZN • Technology • E-commerce & Cloud Computing</p>
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
                  <div className="text-2xl font-bold text-blue-900">$200-300 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <ShoppingCart className="h-6 w-6 text-orange-500 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Conglomerate Excellence</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Amazon is a conglomerate that conducts business through three main segments: online retail, cloud computing, and video streaming. All three of these segments are among the best in their respective classes, each with strong competitive advantages.
                </p>
                <p className="mb-4">
                  The retail business has the largest distribution network in the world and is extremely customer-focused, making it attractive for both third-party sellers and customers. AWS, their cloud computing unit, is the largest of the three major cloud providers, supporting the entire tech infrastructures of thousands of companies, making it extremely sticky. Amazon Prime Video is a top three streaming service offered for free with an Amazon Prime membership, providing a cross-selling advantage and a loyal subscriber base.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Investment Philosophy</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Amazon has always had the promise of generating immense cash flows. However, the company often reinvests these earnings into expanding its business. For example, in 2021, they overhauled their retail distribution network and doubled their capacity. In 2024, they invested heavily into AWS to prepare for AI workloads.
                </p>
                <p className="mb-4">
                  This behaviour is expected to continue, as Amazon frequently expands into new businesses and is willing to take risks, some of which fail, but the successful ones more than make up for it, such as AWS. This approach increases Amazon's Total Addressable Market (TAM) but also makes the company difficult to value. Nevertheless, their core businesses have grown so significantly that they should generate large free cash flows in the future.
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
                <Server className="h-5 w-5 text-blue-600 mr-2" />
                AWS & Cloud Computing
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  AWS is anticipated to continue growing mid-teens per year as the shift from on-premise computing to cloud computing increases, and as existing customers increase their compute workloads. The AI revolution is driving unprecedented demand for cloud infrastructure, positioning AWS to capture significant value.
                </p>
                <p className="mb-4">
                  As the market leader with the broadest service offering, AWS benefits from economies of scale and network effects that create sustainable competitive advantages. The high switching costs and mission-critical nature of cloud infrastructure ensure customer retention and pricing power.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
                E-commerce & Advertising
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Amazon's retail business is expected to grow by mid-single digits per year as more shopping shifts online, with Amazon poised to gain a larger market share due to their superior service capabilities. Their third-party seller services are expected to grow by approximately low teens, leveraging Amazon's extensive reach and distribution network.
                </p>
                <p className="mb-4">
                  Additionally, Amazon is massively expanding their advertising business, which is already a $58 billion per year business growing at 20%. They have a huge platform with more demand than supply, allowing for significant scaling opportunities. The key point is that the high-margin parts of Amazon's business are growing much faster than standard retail, enabling margin expansion while sustaining low to mid-teens overall growth.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Largest e-commerce and logistics network globally</li>
                  <li>• Leading cloud infrastructure provider with AWS</li>
                  <li>• Prime ecosystem creating customer lock-in</li>
                  <li>• Economies of scale in fulfillment and technology</li>
                  <li>• Culture of innovation and long-term thinking</li>
                  <li>• Diversified revenue streams reducing risk</li>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2024 Investment Journey</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  A half position in Amazon was started before their August earnings report. After the earnings report, the stock dipped 13% due to slightly slower-than-expected AWS growth by 1%. This larger-than-expected drop allowed for building out a full position of 6 shares at an average cost of $174 USD.
                </p>
                <p className="mb-4">
                  The stock recovered towards the end of the year with the general market and accelerating AWS growth. The company's performance validated the investment thesis, demonstrating Amazon's ability to execute across multiple business segments.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Excellence</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The new CEO's focus on efficiency and profitability should enhance growth prospects. Amazon's ability to generate substantial free cash flows while continuing to invest in growth initiatives demonstrates the strength of the business model.
                </p>
                <p className="mb-4">
                  There are no foreseeable disruptions to their core businesses, giving Amazon full control over their future with a very long runway for continued growth. The expected return on Amazon remains excellent even at current prices, warranting additional investment consideration.
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
                  <span className="text-gray-700">Dominant positions in e-commerce and cloud computing</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">AWS benefiting from AI infrastructure demand</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">High-margin advertising business growing 20%+ annually</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Prime ecosystem with 200+ million subscribers</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Culture of innovation and customer obsession</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Improving operational efficiency under new leadership</span>
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
                  <span className="text-gray-700">Regulatory scrutiny and antitrust concerns</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Intense competition in cloud from Microsoft and Google</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Margin pressure in retail from competition</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Heavy capital requirements for infrastructure</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Economic sensitivity in consumer spending</span>
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
                Amazon represents a unique investment opportunity combining leadership positions in multiple large and growing markets. The company's ability to dominate e-commerce, cloud computing, and digital advertising while continuously innovating demonstrates exceptional execution and strategic vision.
              </p>
              <p className="mb-4">
                The transition to a more efficiency-focused approach under new leadership, combined with the massive growth potential in cloud computing driven by AI, positions Amazon for sustained value creation. The company's willingness to invest for the long term, while sometimes creating near-term volatility, has consistently produced superior returns for patient investors.
              </p>
              <p className="mb-4">
                With its diversified business model, strong competitive positions, and multiple growth drivers, Amazon offers investors exposure to several of the most important technology trends of the next decade. The current valuation provides an attractive entry point for long-term investors who appreciate the company's unique ability to create and capture value across multiple industries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}