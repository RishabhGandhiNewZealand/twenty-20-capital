import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const reports2024 = [
    {
      title: "2024 Annual Review",
      description: "Complete analysis of 2024 investment performance and key learnings",
      date: "December 31, 2024",
      href: "/reports/2024-review",
      type: "Annual",
      performance: "+48.39%",
    },
  ]

  const reports2025 = [
    {
      title: "Q1 2025 Report",
      description: "First quarter performance review and market outlook",
      date: "March 31, 2025",
      href: "/reports/q1-2025",
      type: "Quarterly",
      performance: "-5.4%",
      portfolioValue: "$34,788 NZD",
      additions: "$6,500 NZD",
    },
    {
      title: "Q2 2025 Report",
      description: "Second quarter analysis and portfolio adjustments",
      date: "June 30, 2025",
      href: "/reports/q2-2025",
      type: "Quarterly",
      performance: "+5.18%",
      portfolioValue: "$42,098 NZD",
      additions: "$2,000 NZD",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Reports</h1>
          <p className="text-gray-600">Quarterly and annual performance reviews</p>
        </div>

        {/* 2025 Reports */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2025 Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports2025.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="border-blue-100 hover:border-blue-300 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {report.type}
                      </span>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-gray-900">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{report.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {report.date}
                        </div>
                        <div className={`flex items-center ${
                          report.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {report.performance}
                        </div>
                      </div>
                      {report.portfolioValue && (
                        <div className="text-sm text-center">
                          <span className="text-gray-500">Portfolio Value: </span>
                          <span className="font-medium text-gray-900">{report.portfolioValue}</span>
                        </div>
                      )}
                      {report.additions && (
                        <div className="text-sm text-center">
                          <span className="text-gray-500">Additions: </span>
                          <span className="font-medium text-blue-600">{report.additions}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 2024 Reports */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2024 Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports2024.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="border-blue-100 hover:border-blue-300 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {report.type}
                      </span>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-gray-900">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{report.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {report.date}
                        </div>
                        <div className={`flex items-center ${
                          report.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {report.performance}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
