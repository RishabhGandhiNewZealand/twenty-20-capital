import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Briefcase } from "lucide-react"

export default function Q2Report2025Page() {
  const quarterStats = [
    { label: "Q2 Return", value: "+5.7%", icon: TrendingUp },
    { label: "Portfolio Value", value: "$142,510", icon: DollarSign },
  ]

  const portfolioHoldings = [
    { 
      symbol: "NVDA", 
      name: "NVIDIA Corporation",
      allocation: "17.8%", 
      return: "+4.2%",
      shares: "52",
      value: "$25,370"
    },
    { 
      symbol: "UBER", 
      name: "Uber Technologies",
      allocation: "14.5%", 
      return: "+6.1%",
      shares: "315",
      value: "$20,640"
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corporation",
      allocation: "15.9%", 
      return: "+3.8%",
      shares: "65",
      value: "$22,660"
    },
  ]

  const watchlist = [
    { symbol: "ASML", name: "ASML Holding N.V.", reason: "Semiconductor equipment leader" },
    { symbol: "TSM", name: "Taiwan Semiconductor", reason: "Foundry leader, AI chip demand" },
    { symbol: "META", name: "Meta Platforms", reason: "AI infrastructure investment" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q2 2025 Report</h1>
          <p className="text-gray-600">Second quarter analysis and portfolio adjustments</p>
        </div>

        {/* Quarter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Portfolio Holdings */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Portfolio Holdings at Quarter End
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioHoldings.map((holding) => (
                <div key={holding.symbol} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-gray-900">{holding.symbol}</span>
                      <span className="text-gray-600 ml-2">{holding.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{holding.return}</div>
                      <div className="text-sm text-gray-500">{holding.allocation}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{holding.shares} shares</span>
                    <span className="font-medium">{holding.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Text Content */}
        <div className="space-y-8">
          {/* Portfolio Summary */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>Q2 2025 portfolio summary content goes here...</p>
              </div>
            </CardContent>
          </Card>

          {/* Individual Holdings */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">NVDA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>NVDA Q2 analysis goes here...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">UBER</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>UBER Q2 analysis goes here...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">MSFT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>MSFT Q2 analysis goes here...</p>
              </div>
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {watchlist.map((stock) => (
                  <div key={stock.symbol} className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{stock.symbol}</span>
                      <span className="text-sm text-gray-600">{stock.name}</span>
                    </div>
                    <p className="text-sm text-gray-700">{stock.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Closing Thoughts */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Closing Thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>Q2 2025 closing thoughts content goes here...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
