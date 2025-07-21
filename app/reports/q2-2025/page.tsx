import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, AlertTriangle, Target } from "lucide-react"
import Image from "next/image"

export default function Q2Report2025Page() {
  const quarterStats = [
    { label: "Q2 Return", value: "+5.7%", icon: TrendingUp },
    { label: "Portfolio Value", value: "$142,510", icon: DollarSign },
    { label: "Rebalanced Positions", value: "5", icon: Target },
    { label: "Risk Level", value: "Moderate", icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q2 2025 Report</h1>
          <p className="text-gray-600">Second quarter analysis and portfolio adjustments</p>
        </div>

        {/* Quarter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quarterStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Q2 Sector Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=300&width=500&text=Q2+2025+Sector+Performance"
                  alt="Q2 2025 Sector Performance"
                  width={500}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Adjustments */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-medium text-gray-900">Added Positions</h4>
                  <p className="text-sm text-gray-600">Increased exposure to defensive sectors</p>
                </div>
                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-medium text-gray-900">Reduced Positions</h4>
                  <p className="text-sm text-gray-600">Trimmed overweight tech positions</p>
                </div>
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-medium text-gray-900">Rebalanced</h4>
                  <p className="text-sm text-gray-600">Maintained target allocation ranges</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Outlook */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Q2 Summary & Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Q2 2025 delivered solid returns of 5.7% despite increased market volatility. The quarter was marked by
                strategic rebalancing to reduce concentration risk and improve defensive positioning.
              </p>
              <p className="mb-4">
                Key actions included trimming overweight technology positions and adding exposure to utilities and
                consumer staples. This defensive tilt proved beneficial during the mid-quarter market correction.
              </p>
              <p>
                Entering Q3 with a balanced approach, focusing on quality companies with strong fundamentals and
                maintaining adequate cash reserves for potential opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
