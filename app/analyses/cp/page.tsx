"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Globe, AlertTriangle, Train, Target, Loader2, MapPin, Zap } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function CPKCAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/CP')
        
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
                <span className="text-white font-bold text-xl">CP</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Canadian Pacific Kansas City</h1>
                <p className="text-gray-600">NYSE: CP • Industrials • Class 1 Railroad</p>
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
                  <div className="text-2xl font-bold text-blue-900">$90-110 USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Train className="h-6 w-6 text-red-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Unparalleled North American Network</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  CPKC is a class 1 North American railroad company with a network spanning southern Canada and the US upper Midwest, expanding into the southern United States and Mexico after merging with Kansas City Southern Railways. This creates the only single-line rail network connecting Canada, the United States, and Mexico, providing unparalleled reach across the entire North American continent.
                </p>
                <p className="mb-4">
                  The company transports diverse freight including grain, coal, potash, automobiles, and consumer goods, providing significant cost and speed advantages over trucking and shipping alternatives. This irreplaceable network establishes a strong competitive moat, enabling superior service and allowing for sustained market share gains.
                </p>
              </div>
            </div>

            {/* Network Map */}
            <div className="my-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">CPKC Rail Network Post-Merger</h4>
              <div className="relative h-96 mb-4">
                <Image
                  src="/CPKC.jpg"
                  alt="CPKC rail network post-merger"
                  fill
                  className="object-contain rounded-lg border border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-600 italic text-center">
                CPKC rail network post-merger. It spans the entire North American continent, enabling unparalleled service.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategic Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The merger with Kansas City Southern has created unique strategic advantages. CPKC now offers the most direct route for goods moving between Canada and Mexico, bypassing congested rail interchanges in Chicago and other major hubs. This efficiency translates to faster transit times and lower costs for customers.
                </p>
                <p className="mb-4">
                  The experienced management team is focused on achieving significant synergies in the coming years while maintaining stable cash flows and investing in the legacy KC network. The company also aims to invest in new technologies like hydrogen locomotives, further strengthening the company's moat and environmental credentials.
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
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                Merger Synergies & Growth
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The next 2-3 years are crucial for CPKC to demonstrate revenue increases, margin improvements, effective challenge navigation, and capital returns to shareholders. The company is well-positioned to exceed these expectations, leading to excellent returns over the next decade.
                </p>
                <p className="mb-4">
                  Key synergies from the merger include operational efficiencies, network optimization, and the ability to offer single-line service across North America. These advantages should drive both revenue growth and margin expansion as the integration progresses.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 text-green-600 mr-2" />
                Innovation & Sustainability
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  CPKC is investing in cutting-edge technologies, including hydrogen locomotives, to maintain its competitive edge and meet environmental goals. These investments not only reduce operating costs over time but also position the company favorably with ESG-conscious customers and investors.
                </p>
                <p className="mb-4">
                  The company's commitment to operational excellence and technological advancement ensures it remains at the forefront of the rail industry, capable of adapting to changing market conditions and customer needs.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Moat</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Only single-line rail network connecting Canada, US, and Mexico</li>
                  <li>• Irreplaceable infrastructure with high barriers to entry</li>
                  <li>• Cost advantages over trucking and shipping alternatives</li>
                  <li>• Direct routes bypassing congested rail interchanges</li>
                  <li>• Strong customer relationships and long-term contracts</li>
                  <li>• Experienced management team with proven track record</li>
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
                  In 2024, the stock returned roughly -9%, despite increasing revenues by 6% and improving margins amid challenges like a union strike and a major derailment. The company adhered to its capex guidance, demonstrating financial discipline and operational resilience.
                </p>
                <p className="mb-4">
                  The stock peaked at around $91 during the year but declined due to strikes, a derailment, and proposed tariffs from incoming President Trump. Despite these headwinds, the company's operating performance remained solid, increasing the intrinsic value of the business.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Highlights</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Revenue growth of 6% demonstrates the company's ability to grow despite economic headwinds. Margin improvements show successful cost management and early merger synergy realization. The company maintained its capital expenditure discipline while investing in network improvements and technology upgrades.
                </p>
                <p className="mb-4">
                  Management has effectively navigated operational challenges, including labor disputes and service disruptions, while maintaining focus on long-term strategic objectives and shareholder value creation.
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
                  <span className="text-gray-700">Only single-line network connecting three North American countries</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Significant merger synergies yet to be realized</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Cost and speed advantages over trucking alternatives</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Investment in hydrogen locomotives and green technology</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Experienced management team with strong execution track record</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Irreplaceable infrastructure with high barriers to entry</span>
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
                  <span className="text-gray-700">Exposure to trade tariffs and protectionist policies</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Labor union strikes and operational disruptions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Regulatory challenges and safety compliance costs</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Economic sensitivity to commodity and industrial cycles</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Integration risks from Kansas City Southern merger</span>
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
                Canadian Pacific Kansas City represents a unique investment opportunity in North American rail infrastructure. The company's unparalleled network spanning three countries provides an irreplaceable competitive advantage that should drive sustained growth and market share gains.
              </p>
              <p className="mb-4">
                While near-term challenges including labor disputes, trade uncertainties, and integration complexities have pressured the stock, the long-term investment thesis remains intact. The company's focus on operational excellence, technological innovation, and synergy realization positions it well for the coming decade.
              </p>
              <p className="mb-4">
                For investors with a long-term perspective, CPKC offers exposure to North American trade growth through a company with significant competitive advantages and a clear path to value creation. The current valuation may provide an attractive entry point for those who believe in the strategic value of the combined network and management's ability to execute.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}