import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Star, Calendar } from "lucide-react"
import Link from "next/link"

export default function AnalysesPage() {
  const analyses = [
    {
      company: "Uber Technologies",
      symbol: "UBER",
      sector: "Technology",
      targetPrice: "$85",
      currentPrice: "$72",
      href: "/analyses/uber",
      lastUpdated: "March 15, 2025",
      keyPoints: ["Strong ride-sharing recovery", "Expanding delivery business", "Path to profitability clear"],
    },
    {
      company: "ASML Holding",
      symbol: "ASML",
      sector: "Technology Hardware",
      targetPrice: "$900",
      currentPrice: "$[CURRENT_PRICE]",
      href: "/analyses/asml",
      lastUpdated: "March 15, 2025",
      keyPoints: ["EUV lithography monopoly", "90%+ market share", "10-15% revenue growth expected"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Analyses</h1>
          <p className="text-gray-600">In-depth analysis of individual companies and investment opportunities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyses.map((analysis) => (
            <Link key={analysis.symbol} href={analysis.href}>
              <Card className="border-blue-100 hover:border-blue-300 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-gray-900">{analysis.company}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {analysis.symbol} • {analysis.sector}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-lg font-semibold text-gray-900">{analysis.currentPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Target Price</p>
                        <p className="text-lg font-semibold text-green-600">{analysis.targetPrice}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Key Investment Points:</p>
                      <ul className="space-y-1">
                        {analysis.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <Star className="h-3 w-3 text-blue-600 mr-2 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                      <Calendar className="h-4 w-4 mr-1" />
                      Last updated: {analysis.lastUpdated}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
