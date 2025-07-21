import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const portfolioStats = [
    {
      title: "Total Portfolio Value",
      value: "$127,450",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Monthly Return",
      value: "+3.2%",
      change: "+0.8%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "YTD Performance",
      value: "+18.7%",
      change: "+2.1%",
      trend: "up",
      icon: PieChart,
    },
    {
      title: "Total Positions",
      value: "23",
      change: "+2",
      trend: "up",
      icon: TrendingUp,
    },
  ]

  const topHoldings = [
    { symbol: "AAPL", name: "Apple Inc.", allocation: "15.2%", value: "$19,372" },
    { symbol: "MSFT", name: "Microsoft Corp.", allocation: "12.8%", value: "$16,314" },
    { symbol: "GOOGL", name: "Alphabet Inc.", allocation: "10.5%", value: "$13,382" },
    { symbol: "UBER", name: "Uber Technologies", allocation: "8.3%", value: "$10,579" },
    { symbol: "ASML", name: "ASML Holding", allocation: "7.9%", value: "$10,069" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {portfolioStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center text-sm">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                    <span className="text-gray-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Chart */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=300&width=500&text=Portfolio+Performance+Chart"
                  alt="Portfolio Performance Chart"
                  width={500}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Top Holdings */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Top Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topHoldings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{holding.symbol}</div>
                      <div className="text-sm text-gray-500">{holding.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{holding.value}</div>
                      <div className="text-sm text-blue-600">{holding.allocation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
