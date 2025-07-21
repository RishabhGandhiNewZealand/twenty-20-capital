import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Award } from "lucide-react"
import Image from "next/image"

export default function Review2024Page() {
  const yearStats = [
    { label: "Total Return", value: "+24.3%", icon: TrendingUp, positive: true },
    { label: "Best Month", value: "November (+8.2%)", icon: Award, positive: true },
    { label: "Worst Month", value: "March (-3.1%)", icon: TrendingDown, positive: false },
    { label: "Trades Executed", value: "47", icon: Target, positive: true },
  ]

  const topPerformers = [
    { symbol: "NVDA", return: "+89.2%", contribution: "+$12,450" },
    { symbol: "UBER", return: "+67.3%", contribution: "+$8,920" },
    { symbol: "MSFT", return: "+31.5%", contribution: "+$6,780" },
  ]

  const lessons = [
    "Diversification across sectors proved crucial during market volatility",
    "Tech stocks outperformed expectations, validating the AI investment thesis",
    "Regular rebalancing helped capture gains and manage risk effectively",
    "Patience with long-term positions yielded better results than frequent trading",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">2024 Annual Review</h1>
          <p className="text-gray-600">A comprehensive look at my investment performance in 2024</p>
        </div>

        {/* Year Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {yearStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.positive ? "text-green-600" : "text-red-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">2024 Performance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=300&width=500&text=2024+Performance+Chart"
                  alt="2024 Performance Chart"
                  width={500}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{stock.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{stock.return}</div>
                      <div className="text-sm text-gray-500">{stock.contribution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Lessons */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Key Lessons Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson, index) => (
                <div key={index} className="flex items-start">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{lesson}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
