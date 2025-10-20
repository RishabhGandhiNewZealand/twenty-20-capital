"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Target, Globe } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">About Us</h1>
          <p className="text-gray-600">Learn more about Rish Invests and our mission</p>
        </div>

        {/* Mission Statement */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed">
              [Mission statement placeholder - To be filled with information about the purpose and goals of Rish Invests]
            </p>
          </CardContent>
        </Card>

        {/* Who We Are */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Who We Are
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed mb-4">
              [Team information placeholder - Details about the team behind Rish Invests]
            </p>
            <p className="text-gray-600 leading-relaxed">
              [Background and expertise placeholder]
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              What We Do
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Investment Tracking</h3>
                <p className="text-gray-600">
                  [Description of investment tracking services and features]
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
                <p className="text-gray-600">
                  [Description of market analysis and research capabilities]
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Portfolio Insights</h3>
                <p className="text-gray-600">
                  [Description of portfolio insights and reporting features]
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-blue-100">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Get in Touch
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 mb-4">
              [Contact information placeholder - How to reach out for questions or collaboration]
            </p>
            <div className="space-y-2 text-gray-600">
              <p>[Email placeholder]</p>
              <p>[Social media links placeholder]</p>
              <p>[Other contact methods placeholder]</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}