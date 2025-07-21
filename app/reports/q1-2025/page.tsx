import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, PieChart, Target } from "lucide-react"
import Image from "next/image"

export default function Q1Report2025Page() {
  const quarterStats = [
    { label: "Q1 Return", value: "+8.1%", icon: TrendingUp },
    { label: "Portfolio Value", value: "$134,820", icon: DollarSign },
    { label: "New Positions", value: "3", icon: Target },
    { label: "Sector Allocation", value: "8 Sectors", icon: PieChart },
  ]

  const monthlyPerformance = [
    { month: "January", return: "+3.2%", market: "+2.8%" },
    { month: "February", return: "+2.1%", market: "+1.9%" },
    { month: "March", return: "+2.6%", market: "+2.3%" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q1 2025 Report</h1>
          <p className="text-gray-600">First quarter performance review and market outlook</p>
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
              <CardTitle className="text-gray-900">Q1 Performance vs Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=300&width=500&text=Q1+2025+Performance+vs+Market"
                  alt="Q1 2025 Performance Chart"
                  width={500}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyPerformance.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{month.return}</div>
                      <div className="text-sm text-gray-500">Market: {month.market}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Highlights */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Q1 Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                The first quarter of 2025 showed strong performance with an 8.1% return, outpacing the broader market by
                1.5%. Key drivers included continued strength in technology stocks and strategic positioning in emerging
                sectors.
              </p>
              <p className="mb-4">
                Added three new positions during the quarter: renewable energy ETF, cybersecurity stock, and a
                healthcare REIT. These additions improved portfolio diversification while maintaining growth focus.
              </p>
              <p>
                Looking ahead to Q2, maintaining cautious optimism while monitoring inflation trends and Federal Reserve
                policy decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
