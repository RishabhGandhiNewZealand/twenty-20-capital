"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Plus, Calendar, BarChart3 } from "lucide-react"

export default function HomePage() {
  const portfolioStats = [
    {
      title: "Portfolio Value",
      value: "$127,450",
      subtitle: "$42,000 invested • $7,000 gains (+16.7%)",
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
      title: "Capital added this year",
      value: "$25,000",
      icon: Plus,
    },
    {
      title: "Portfolio MWR CAGR",
      value: "+22.3%",
      description: "Money-weighted return since inception",
      icon: BarChart3,
    },
    {
      title: "S&P 500 MWR CAGR",
      value: "+19.8%",
      description: "S&P 500 money-weighted return since inception",
      icon: Calendar,
    },
  ]

  // Function to get company logo URL
  const getLogoUrl = (symbol: string) => {
    return `https://logo.clearbit.com/${getCompanyDomain(symbol)}`
  }

  const getCompanyDomain = (symbol: string) => {
    const domains: { [key: string]: string } = {
      'UBER': 'uber.com',
      'GOOGL': 'google.com',
      'AMZN': 'amazon.com',
      'META': 'meta.com',
      'NFLX': 'netflix.com',
      'MA': 'mastercard.com',
      'ASML': 'asml.com',
      'SPGI': 'spglobal.com',
      'MFT': 'mainfreight.com'
    }
    return domains[symbol] || `${symbol.toLowerCase()}.com`
  }

  const holdings = [
    { 
      symbol: "UBER", 
      name: "Uber Technologies",
      allocation: 14.8,
      shares: 40,
      value: "$6,220"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc",
      allocation: 12.5,
      shares: 18,
      value: "$5,280"
    },
    { 
      symbol: "ASML", 
      name: "ASML Holding N.V.",
      allocation: 12.3,
      shares: 4,
      value: "$5,160"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc",
      allocation: 11.3,
      shares: 13,
      value: "$4,745"
    },
    { 
      symbol: "NFLX", 
      name: "Netflix Inc",
      allocation: 10.6,
      shares: 2,
      value: "$4,467"
    },
    { 
      symbol: "MFT", 
      name: "Mainfreight Limited",
      allocation: 10.7,
      shares: 67,
      value: "$4,499"
    },
    { 
      symbol: "SPGI", 
      name: "S&P Global Inc",
      allocation: 10.4,
      shares: 5,
      value: "$4,392"
    },
    { 
      symbol: "MA", 
      name: "Mastercard Inc",
      allocation: 8.9,
      shares: 4,
      value: "$3,740"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms Inc",
      allocation: 8.5,
      shares: 3,
      value: "$3,595"
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Since inception: October 2023</p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  {stat.subtitle && (
                    <p className="text-sm text-gray-700 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  )}
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
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={holding.symbol} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          <img 
                            src={getLogoUrl(holding.symbol)} 
                            alt={`${holding.symbol} logo`}
                            className="w-6 h-6 rounded mr-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span className="font-bold text-gray-900">{holding.symbol}</span>
                        </div>
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
