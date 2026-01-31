"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency } from "@/lib/anonymization-utils"

export default function ReportsPage() {
  const { isAnonymized } = useAnonymization()

  const reports2024 = [
    {
      title: "2024 Annual Review",
      description: "Complete analysis of 2024 investment performance and key learnings",
      date: "December 31, 2024",
      href: "/reports/2024-review",
      type: "Annual",
      performance: "+30.70%",
    },
  ]

  const reports2025 = [
    {
      title: "2025 Annual Review",
      description: "Comprehensive portfolio review, investing philosophy update, and 2025 performance analysis",
      date: "December 31, 2025",
      href: "/reports/2025-review",
      type: "Annual",
      performance: "+25.98%",
      portfolioValue: 59015,
      additions: 20000,
    },
    {
      title: "Q1 2025 Report",
      description: "First quarter performance review and market outlook",
      date: "March 31, 2025",
      href: "/reports/q1-2025",
      type: "Quarterly",
      performance: "-7.44%",
      portfolioValue: 34788,
      additions: 6500,
    },
    {
      title: "Q2 2025 Report",
      description: "Second quarter analysis and portfolio adjustments",
      date: "June 30, 2025",
      href: "/reports/q2-2025",
      type: "Quarterly",
      performance: "+13.13%",
      portfolioValue: 42098,
      additions: 2000,
    },
    {
      title: "Q3 2025 Report",
      description: "Third quarter analysis and portfolio adjustments",
      date: "September 30, 2025",
      href: "/reports/q3-2025",
      type: "Quarterly",
      performance: "+16.82%",
      portfolioValue: 47000,
      additions: 5000,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Investment Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Quarterly and annual performance reviews</p>
          <p className="text-xs text-gray-500 mt-2 italic">
            Note: Performance values shown here may differ slightly from figures mentioned within individual reports due to different reporting methodologies applied at the time of report creation.
          </p>
        </div>

        {/* 2025 Reports */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">2025 Reports</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {reports2025.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-base sm:text-lg">{report.title}</CardTitle>
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {report.date}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {report.type}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 sm:mb-4">{report.description}</p>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Performance</p>
                        <p className={`text-base sm:text-lg font-semibold ${report.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {report.performance}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Portfolio Value</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                          {maskCurrency(report.portfolioValue, isAnonymized, 'NZD')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex items-center text-blue-600 text-sm">
                      <span>View Report</span>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 2024 Reports */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">2024 Reports</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {reports2024.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-base sm:text-lg">{report.title}</CardTitle>
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {report.date}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                        {report.type}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 sm:mb-4">{report.description}</p>

                    <div className="pt-3 sm:pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-1">Annual Performance</p>
                      <p className={`text-lg sm:text-xl font-semibold text-green-600`}>
                        {report.performance}
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-4 flex items-center text-blue-600 text-sm">
                      <span>View Report</span>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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
