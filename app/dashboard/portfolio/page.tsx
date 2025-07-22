import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Target, Plus } from "lucide-react"

export default function PortfolioPage() {
  const holdings = [
    { 
      symbol: "AAPL", 
      name: "Apple Inc.", 
      allocation: 22.5,
      shares: 50, 
      value: "$8,750", 
      tier: "S"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc.", 
      allocation: 18.3,
      shares: 25, 
      value: "$6,250", 
      tier: "A"
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corp.", 
      allocation: 16.8,
      shares: 30, 
      value: "$9,450", 
      tier: "S"
    },
    { 
      symbol: "TSLA", 
      name: "Tesla Inc.", 
      allocation: 12.4,
      shares: 15, 
      value: "$3,750", 
      tier: "A"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc.", 
      allocation: 15.2,
      shares: 18, 
      value: "$4,850", 
      tier: "S"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms Inc.", 
      allocation: 14.8,
      shares: 12, 
      value: "$5,200", 
      tier: "S"
    },
  ]

  const portfolioStats = [
    { 
      label: "Portfolio Value", 
      value: "$38,250", 
      icon: Target,
      description: "Total portfolio value"
    },
    { 
      label: "YTD Performance", 
      value: "+12.8%", 
      icon: TrendingUp,
      description: "Year to date return"
    },
    { 
      label: "S&P 500 YTD", 
      value: "+14.2%", 
      icon: DollarSign,
      description: "S&P 500 benchmark"
    },
    { 
      label: "Total Additions", 
      value: "$5,000", 
      icon: Plus,
      description: "Capital added this year"
    },
  ]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Portfolio</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Holdings</CardTitle>
            <CardDescription>Current investment positions and allocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Allocation</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Shares</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Value</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={holding.symbol} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-background'}`}>
                      <td className="py-3 px-2">
                        <span className="font-bold">{holding.symbol}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm">{holding.name}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-medium">{holding.allocation}%</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-muted-foreground">{holding.shares}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-medium">{holding.value}</span>
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
    </>
  )
}
