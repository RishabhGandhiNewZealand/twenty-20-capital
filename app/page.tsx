import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const portfolioStats = [
    {
      title: "Portfolio Value",
      value: "$127,450",
      description: "Total portfolio value",
      icon: Target,
    },
    {
      title: "YTD Performance",
      value: "+18.7%",
      description: "Year to date return",
      icon: TrendingUp,
    },
    {
      title: "S&P 500 YTD",
      value: "+15.2%",
      description: "S&P 500 benchmark",
      icon: DollarSign,
    },
    {
      title: "Total Additions",
      value: "$25,000",
      description: "Capital added this year",
      icon: Plus,
    },
  ]

  const holdings = [
    { 
      symbol: "AAPL", 
      name: "Apple Inc.", 
      allocation: 15.2,
      shares: 125, 
      value: "$19,372", 
      tier: "S"
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corp.", 
      allocation: 12.8,
      shares: 52, 
      value: "$16,314", 
      tier: "S"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc.", 
      allocation: 10.5,
      shares: 87, 
      value: "$13,382", 
      tier: "A"
    },
    { 
      symbol: "UBER", 
      name: "Uber Technologies", 
      allocation: 8.3,
      shares: 195, 
      value: "$10,579", 
      tier: "A"
    },
    { 
      symbol: "ASML", 
      name: "ASML Holding", 
      allocation: 7.9,
      shares: 15, 
      value: "$10,069", 
      tier: "S"
    },
    { 
      symbol: "NFLX", 
      name: "Netflix Inc.", 
      allocation: 6.8,
      shares: 22, 
      value: "$8,667", 
      tier: "S"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms Inc.", 
      allocation: 6.2,
      shares: 18, 
      value: "$7,902", 
      tier: "S"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc.", 
      allocation: 5.8,
      shares: 42, 
      value: "$7,392", 
      tier: "S"
    },
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
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Portfolio Holdings Table */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Symbol</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Company</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Allocation</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Shares</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Value</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={holding.symbol} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-3 px-2">
                        <span className="font-bold text-gray-900">{holding.symbol}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-700">{holding.name}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-medium text-gray-900">{holding.allocation}%</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-gray-700">{holding.shares}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-medium text-gray-900">{holding.value}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={holding.tier === 'S' ? 'default' : 'secondary'}>
                          {holding.tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
