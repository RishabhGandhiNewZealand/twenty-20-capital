import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Globe, AlertTriangle } from "lucide-react"

export default function ASMLAnalysisPage() {
  const metrics = [
    { label: "Current Price", value: "€820.50", change: "+1.8%", icon: DollarSign, positive: true },
    { label: "Target Price", value: "€950.00", change: "+15.8% upside", icon: TrendingUp, positive: true },
    { label: "Market Cap", value: "€325.4B", change: "", icon: Globe, positive: true },
  ]

  const strengths = [
    "Monopoly in EUV lithography technology",
    "Essential for advanced semiconductor manufacturing",
    "Strong order backlog providing revenue visibility",
    "Benefiting from AI and data center chip demand",
    "High barriers to entry and switching costs",
  ]

  const risks = [
    "Geopolitical tensions affecting China sales",
    "Cyclical semiconductor industry exposure",
    "High R&D costs and technology complexity",
    "Concentration risk with few major customers",
    "Potential for technology disruption",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ASML</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ASML Holding N.V.</h1>
              <p className="text-gray-600">NASDAQ: ASML • Technology Hardware • Semiconductors</p>
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
                  {metric.change && (
                    <div className={`text-sm ${metric.positive ? "text-green-600" : "text-red-600"}`}>
                      {metric.change}
                    </div>
                  )}
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
              ASML is a Dutch company that manufactures lithography systems for the semiconductor industry. The company is the world's leading supplier of photolithography equipment used in chip manufacturing.
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
                ASML represents one of the most compelling monopoly positions in the technology sector. The company's
                extreme ultraviolet (EUV) lithography systems are essential for manufacturing the most advanced
                semiconductors, with no viable alternatives from competitors.
              </p>
              <p className="mb-4">
                The artificial intelligence boom has created unprecedented demand for advanced chips, directly
                benefiting ASML's EUV business. Major customers like TSMC, Samsung, and Intel are investing heavily in
                new fabs, creating a multi-year growth cycle for ASML.
              </p>
              <p className="mb-4">
                The company's order backlog provides excellent revenue visibility, while the introduction of High-NA EUV
                systems opens new growth opportunities. ASML's pricing power and high switching costs ensure strong
                margins and cash generation.
              </p>
              <p>
                <strong>Price Target: €950</strong> based on 25x 2025E earnings, reflecting the company's monopoly
                position, strong growth prospects, and essential role in the semiconductor ecosystem.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
