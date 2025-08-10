"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Globe, AlertTriangle, Microscope, Target, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StockPrice, StockPriceError } from "@/types/stock"
import { ANONYMIZATION_CONSTANT } from "@/lib/anonymization-constant"

export default function ASMLAnalysisPage() {
  const [stockData, setStockData] = useState<{
    currentPrice?: number
    currency?: string
    loading: boolean
    error?: string
  }>({ loading: true })

  useEffect(() => {
    const fetchStockPrice = async () => {
      try {
        const response = await fetch('/api/stock-price/ASML')
        
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

  const strengths = [
    "Near-monopoly in EUV lithography with 90%+ market share",
    "Essential for advanced semiconductor manufacturing",
    "Technological lead of decades over competitors", 
    `EUV machines priced at $${Math.round(300 * ANONYMIZATION_CONSTANT)}M+ each with strong pricing power`,
    "Critical enabler for AI, cloud computing, and automotive chips",
    "Robust order backlog providing revenue visibility"
  ]

  const risks = [
    "Geopolitical tensions affecting China sales",
    "Cyclical semiconductor industry exposure", 
    "High R&D costs and technology complexity",
    "Concentration risk with few major customers",
    "Annual production capacity constraints",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ASML</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ASML Holding N.V.</h1>
                <p className="text-gray-600">NASDAQ: ASML • Technology Hardware • Semiconductors</p>
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
                  <div className="text-2xl font-bold text-blue-900">${Math.round(900 * ANONYMIZATION_CONSTANT)} USD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Pioneering Technological Excellence */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Microscope className="h-5 w-5 text-blue-600 mr-2" />
              Pioneering Technological Excellence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              ASML stands at the forefront of technological innovation, renowned for developing some of the most advanced machinery globally. Their flagship products, Extreme Ultraviolet (EUV) lithography machines, are pivotal in the semiconductor manufacturing process. These machines are so complex that they are often considered more intricate than the James Webb Space Telescope, operating at the cutting edge of multiple physics disciplines.
            </p>
            
            {/* ASML Facility Image */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">ASML Manufacturing Facility</h4>
              <img 
                src="/asml-facility.jpg" 
                alt="ASML advanced semiconductor manufacturing facility showing EUV lithography machines"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                ASML's state-of-the-art facility featuring advanced EUV lithography systems
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Essential Role in Semiconductor Manufacturing */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Essential Role in Semiconductor Manufacturing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              ASML's EUV lithography machines utilize lasers to etch intricate patterns onto silicon wafers, transforming them into powerful semiconductors. This technology is indispensable for producing high-performance chips used in various applications, from artificial intelligence to cloud computing. Major industry players like TSMC and Samsung rely on ASML's equipment to fabricate advanced chips, which are then utilized by companies such as Nvidia to develop cutting-edge processors. Without ASML's technology, the production of high-end chips would be unfeasible.
            </p>
          </CardContent>
        </Card>

        {/* Dominant Market Position and Pricing Power */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Dominant Market Position and Pricing Power</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              ASML holds a near-monopoly in the high-end lithography machine market, commanding over 90% market share in this segment. The company's technological lead is so substantial that it would require a competitor decades and tens of billions of dollars to develop a comparable machine and establish a sustainable supply chain. This dominant position grants ASML significant pricing power, with each EUV machine selling for upwards of ${Math.round(300 * ANONYMIZATION_CONSTANT)} million. Due to the sheer size and complexity of these machines, ASML is limited in how many it can produce annually, further enhancing its pricing leverage.
            </p>
            
            {/* Market Share Chart */}
            <div className="mb-6">
              <img 
                src="/wafer-fab-equipment-market-share.jpg" 
                alt="2023 Wafer Fab Equipment Vendor Market Share by Type of Equipment - showing ASML's dominance across various semiconductor manufacturing segments"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                2023 Wafer Fab Equipment Vendor Market Share by Type of Equipment - Source: Yole Intelligence, 2024
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Continuous Technological Advancement */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Continuous Technological Advancement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 space-y-4">
              <p>
                ASML's technology is underpinned by the Rayleigh criterion, which defines the smallest possible feature size (Critical Dimension, or CD) that can be achieved in lithography. The formula is expressed as:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-center">
                CD = k₁ × λ / NA
              </div>
              <div className="ml-4">
                <p><strong>Where:</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>CD: Critical Dimension</li>
                  <li>k₁: Process factor</li>
                  <li>λ: Wavelength of light used</li>
                  <li>NA: Numerical aperture of the system</li>
                </ul>
              </div>
              <p>
                Currently, ASML's EUV systems operate at a wavelength of 13.5 nm. The transition from Deep Ultraviolet (DUV) to EUV lithography marked a significant advancement, reducing the wavelength by a factor of 14. There remains substantial potential for further miniaturization as advancements in laser and optical systems allow for shorter wavelengths and larger numerical apertures. Additionally, improvements in process factors through enhanced computational lithography techniques can further reduce the critical dimension. This indicates that ASML has ample room for technological improvement over the next two decades, with limited competition in sight.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Robust Demand Driven by Technological Trends */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Robust Demand Driven by Technological Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              The escalating demand for semiconductors, fuelled by advancements in artificial intelligence, automotive technology, energy solutions, and cloud computing, positions ASML favourably for sustained growth. As these sectors expand, the need for high-performance chips intensifies, thereby increasing the demand for ASML's cutting-edge lithography machines. The company's unique market position and technological prowess make it a critical enabler in the ongoing digital transformation across various industries.
            </p>
          </CardContent>
        </Card>

        {/* Resilience Amid Market Volatility */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Resilience Amid Market Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Recently, ASML's stock experienced a decline of over 30% from its all-time highs, primarily due to concerns over reduced sales to China stemming from regulatory restrictions and perceived competitive threats. However, the decrease in Chinese sales is expected to be offset by increased demand from other regions. Moreover, there is no substantial evidence indicating that China or any other nation is close to replicating ASML's advanced technologies. The company's competitive moat remains robust, underscoring its resilience amid market uncertainties.
            </p>
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
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
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
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Growth Expectations and Valuation */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Growth Expectations and Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                I expect revenue growth of around 10-15% and 15-20% FCF growth per annum over the next 10 years as demand for chips expand. This growth trajectory is supported by the structural demand drivers across AI, automotive electrification, cloud computing expansion, and the ongoing digitalization of industries worldwide.
              </p>
              <p className="mb-4">
                In summary, ASML's unparalleled technological leadership, dominant market position, continuous innovation, and the escalating global demand for advanced semiconductors collectively make a compelling case for investing in its stock.
              </p>
              <p>
                <strong>Price Target: ${Math.round(900 * ANONYMIZATION_CONSTANT)} USD</strong> reflecting the company's monopoly position, technological moat, and essential role in enabling the next generation of semiconductor manufacturing across AI, automotive, and cloud computing applications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
