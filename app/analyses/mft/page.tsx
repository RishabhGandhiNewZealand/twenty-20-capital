"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Globe, AlertTriangle, Building2, Target, Loader2, Package, Train, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"

export default function MainfreightAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/MFT')
        
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

  const formatPrice = (price: number, currency: string = 'NZD') => {
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
              <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">MFT</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mainfreight Limited</h1>
                <p className="text-gray-600">NZX: MFT • Industrials • Freight & Logistics</p>
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
                  <div className="text-2xl font-bold text-blue-900">$85-95 NZD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <Package className="h-6 w-6 text-blue-600 mr-2" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Business Model</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mainfreight is a global freight forwarder that provides comprehensive supply chain solutions. The company sells space on trucks, ships, airplanes, and warehouses to help customers manage their supply chain needs. For example, they assist wine makers with transporting grapes from vineyards to processing facilities, showcasing their ability to handle specialized logistics requirements.
                </p>
                <p className="mb-4">
                  The company operates across multiple segments including air freight, ocean freight, warehousing, and domestic transport. This diversified approach allows Mainfreight to offer integrated solutions that span the entire supply chain, from origin to destination.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Geographic Presence</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mainfreight has established a strong global footprint with operations in New Zealand, Australia, Asia, Europe, and the Americas. The company's strategy focuses on leveraging its substantial profitable operations in New Zealand and Australia to fund expansion into international markets.
                </p>
                <p className="mb-4">
                  These mature markets continue to expand, with Mainfreight increasing market share through superior service and ongoing investments, such as the rail-integrated Moore Bank Facility in Sydney. The profits from these established operations are reinvested into growing markets, particularly in the United States and Europe.
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth Strategy</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mainfreight's growth strategy is straightforward yet effective. The company uses profits from its mature markets in New Zealand and Australia to fund expansion in international markets. This self-funded growth model reduces reliance on external capital and maintains financial discipline.
                </p>
                <p className="mb-4">
                  The company focuses on organic growth through market share gains achieved by providing superior service quality. During economic downturns, Mainfreight has historically gained market share as competitors struggle, demonstrating the resilience of their business model.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                Corporate Culture & Management
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Mainfreight fosters a unique culture of internal promotion that leads to high employee satisfaction and retention. This approach ensures deep institutional knowledge is retained and creates strong alignment between employees and company success.
                </p>
                <p className="mb-4">
                  Management and board members regularly purchase company stock with their own funds, signaling strong confidence in the company's future. This insider buying activity provides additional validation of the investment thesis and demonstrates alignment with shareholder interests.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="prose max-w-none text-gray-700">
                <ul className="space-y-2">
                  <li>• Strong brand reputation for service quality and reliability</li>
                  <li>• Integrated global network providing end-to-end solutions</li>
                  <li>• Self-funded growth model maintaining financial flexibility</li>
                  <li>• Culture of continuous improvement and innovation</li>
                  <li>• Strategic investments in infrastructure like rail-integrated facilities</li>
                  <li>• Proven ability to gain market share during economic downturns</li>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Results</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  In their most recent annual results, Mainfreight reported revenue growth of 11% while profit before tax declined 3%. Considering the challenging macroeconomic environment, this performance demonstrates the company's resilience and ability to maintain revenue growth despite headwinds.
                </p>
                <p className="mb-4">
                  The company is executing well across all regions except the United States, where growth has been slower than expected. However, management remains confident that the US operations will become a significant profit contributor over the next five years as the market matures and operational efficiency improves.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Position</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Despite solid fundamental performance, the stock has experienced some volatility due to its listing solely on the NZX, which limits institutional investor participation. This creates opportunities for patient investors as the market can be slow to recognize value in the company.
                </p>
                <p className="mb-4">
                  Over the long term, the company's value follows its fundamentals, and the current market dynamics provide attractive entry points for investors who understand the business's quality and growth potential.
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
                  <span className="text-gray-700">Best-in-class freight forwarding operations in ANZ</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Self-funded international expansion strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strong corporate culture with high employee retention</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Management alignment through consistent insider buying</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Proven ability to gain market share in downturns</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Strategic infrastructure investments enhancing competitiveness</span>
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
                  <span className="text-gray-700">Exposure to global trade volumes and economic cycles</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Potential impact from trade tariffs and protectionism</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">US operations underperforming relative to other regions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Limited liquidity due to sole NZX listing</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">Competition from larger global freight forwarders</span>
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
                Mainfreight represents a high-quality investment opportunity in the global freight forwarding industry. The company's strong position in Australia and New Zealand provides a stable profit base to fund international expansion, while its unique corporate culture and operational excellence drive consistent market share gains.
              </p>
              <p className="mb-4">
                Despite recent headwinds from global trade uncertainties and slower US growth, the company continues to execute its long-term strategy effectively. Management's continued insider buying and the company's proven ability to thrive during economic downturns provide confidence in the investment thesis.
              </p>
              <p className="mb-4">
                For patient investors, Mainfreight offers exposure to global trade growth through a well-managed company with a clear competitive advantage and significant runway for international expansion. The current market dynamics, including limited institutional coverage due to the NZX listing, may provide attractive entry opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}