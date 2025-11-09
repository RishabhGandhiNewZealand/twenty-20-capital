"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Target, Globe } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">About Twenty 20 Capital</h1>
          <p className="text-gray-600">Investment philosophy, approach, and the Capital Appreciation Fund</p>
        </div>

        {/* Mission Statement */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed mb-4">
              Twenty 20 Capital's mission is to generate superior long-term returns through concentrated investments in exceptional businesses. We believe that true wealth creation comes from owning high-quality companies with sustainable competitive advantages, held for the long term.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our approach combines rigorous fundamental analysis with patient capital deployment, allowing us to capitalize on market inefficiencies while avoiding the noise of short-term volatility.
            </p>
          </CardContent>
        </Card>

        {/* The Capital Appreciation Fund */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              The Capital Appreciation Fund
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed mb-4">
              The Capital Appreciation Fund is our flagship investment vehicle, focused on building a concentrated portfolio of 8-15 high-conviction positions. Each holding represents a business we deeply understand and believe will compound value over decades, not quarters.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Fund Characteristics:</strong>
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Concentrated portfolio with high-conviction positions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Long-term holding periods (3-10+ years per position)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Focus on businesses with strong competitive moats</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rigorous fundamental analysis and valuation discipline</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Complete transparency - all holdings and trades publicly disclosed</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Investment Approach */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Our Investment Approach
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quality Over Quantity</h3>
                <p className="text-gray-600">
                  We seek businesses with durable competitive advantages (moats), strong pricing power, high returns on invested capital, and talented management teams aligned with shareholders.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Long-Term Mindset</h3>
                <p className="text-gray-600">
                  Our investment horizon is measured in years, not months. This allows us to focus on business fundamentals rather than short-term stock price movements, and lets the magic of compounding work in our favor.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Concentrated Conviction</h3>
                <p className="text-gray-600">
                  We build meaningful positions in our best ideas. Rather than owning 50+ stocks, we concentrate capital in 8-15 businesses we understand deeply and believe will create substantial value over time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparent Reporting</h3>
                <p className="text-gray-600">
                  Unlike most funds, we operate with complete transparency. Every holding, every trade, every gain and loss is publicly disclosed. We believe transparency builds trust and accountability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Disclosure */}
        <Card className="border-blue-100">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Performance & Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 mb-4">
              All performance metrics, including CAGR (Compound Annual Growth Rate) and returns versus the S&P 500 benchmark, are calculated from the fund's inception and updated in real-time based on market prices.
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Important Notes:</strong>
            </p>
            <ul className="space-y-2 text-gray-600 mb-4">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Past performance does not guarantee future results</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>All holdings and trades are disclosed for educational purposes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>This is not investment advice - please consult a financial advisor</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Portfolio values are displayed in NZD (New Zealand Dollars)</span>
              </li>
            </ul>
            <p className="text-gray-600 text-sm">
              For inquiries, analysis requests, or general questions about our investment approach, please explore our publicly available reports and investment thesis documentation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}