import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react"

export default function UberAnalysisPage() {
  const metrics = [
    { label: "Current Price", value: "$72.45", icon: DollarSign },
    { label: "Target Price", value: "$85.00", icon: TrendingUp },
    { label: "Market Cap", value: "$151.2B", icon: Users },
  ]

  const strengths = [
    "Dominant market position in ride-sharing",
    "Growing delivery and freight businesses",
    "Improving unit economics and path to profitability",
    "Strong brand recognition and network effects",
    "Expanding into new markets and services",
  ]

  const risks = [
    "Regulatory challenges in key markets",
    "Competition from traditional taxi services and new entrants",
    "Driver classification and labor cost issues",
    "Economic sensitivity affecting demand",
    "High cash burn and capital requirements",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">UBER</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Uber Technologies Inc.</h1>
              <p className="text-gray-600">NASDAQ: UBER • Technology • Transportation</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{metric.label}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Business Summary */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Business Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Uber Technologies is a mobility and delivery company that operates ride-sharing, food delivery, and freight services through its technology platform connecting drivers and riders globally.
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

        {/* Investment Thesis */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Investment Thesis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Uber represents a compelling investment opportunity as the company transitions from growth-at-all-costs
                to sustainable profitability. The ride-sharing market has largely recovered from pandemic lows, and
                Uber's dominant market position provides significant competitive advantages.
              </p>
              <p className="mb-4">
                The delivery business, accelerated by the pandemic, has shown strong retention and continues to grow.
                Uber's platform approach allows for cross-selling opportunities and improved unit economics across all
                business segments.
              </p>
              <p className="mb-4">
                Key catalysts include continued improvement in take rates, expansion into new markets, and the potential
                for autonomous vehicle partnerships. The company's focus on becoming EBITDA positive while maintaining
                growth makes it an attractive investment at current valuations.
              </p>
              <p>
                <strong>Price Target: $85</strong> based on 4.5x 2025E revenue multiple, reflecting the company's
                improving profitability profile and market leadership position.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
