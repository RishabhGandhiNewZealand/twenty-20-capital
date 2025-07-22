import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import Link from "next/link"

export default function AnalysesPage() {
  const analyses = [
    {
      company: "Uber Technologies",
      symbol: "UBER",
      sector: "Transportation & Delivery",
      intrinsicValue: "$110",
      currentMarketCap: "$126B",
      href: "/analyses/uber",
      lastUpdated: "December 4, 2024",
      summary: "Uber exhibits strong fundamental attributes with a significant competitive advantage built on 15+ years of data and network effects. The company has achieved critical scale leading to expanding profit margins, generating consistent cash flows despite facing challenges from autonomous vehicles and regulatory pressures.",
      logo: "UBER",
      logoColor: "bg-black",
    },
    {
      company: "ASML Holding",
      symbol: "ASML",
      sector: "Technology Hardware",
      intrinsicValue: "$900",
      currentMarketCap: "$325.4B",
      href: "/analyses/asml",
      lastUpdated: "March 15, 2025",
      summary: "ASML maintains a near-monopoly in EUV lithography with 90%+ market share, making it essential for advanced semiconductor manufacturing. The company's technological lead and robust demand from AI, automotive, and cloud computing positions it favorably for sustained growth despite cyclical industry pressures.",
      logo: "ASML",
      logoColor: "bg-blue-600",
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
                    <div className={`w-12 h-12 ${analysis.logoColor} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{analysis.logo}</span>
                    </div>
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
                        <p className="text-sm text-gray-500">Current Market Cap</p>
                        <p className="text-lg font-semibold text-gray-900">{analysis.currentMarketCap}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Intrinsic Value</p>
                        <p className="text-lg font-semibold text-blue-600">{analysis.intrinsicValue}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Investment Summary:</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {analysis.summary}
                      </p>
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
