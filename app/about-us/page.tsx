"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Target, Globe } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">About</h1>
          <p className="text-gray-600">Learn more about RishInvests and my mission</p>
        </div>

        {/* Mission Statement */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              My Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed">
              My mission is to achieve superior long-term capital appreciation by investing in a concentrated portfolio of high-quality, compounding businesses. I believe that disciplined analysis, emotional stability, and a long-term time horizon are the keys to outperforming the market.
            </p>
          </CardContent>
        </Card>

        {/* Who We Are */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              What is RishInvests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-gray-600 leading-relaxed mb-4">
              RishInvests is a personal portfolio tracker focused on public equity markets. I am not a trader; I am a business owner. I view every stock ticker as an ownership stake in a real business.
            </p>
            <p className="text-gray-600 leading-relaxed">
              I bring a rigorous, fundamental approach to investing, focusing on understanding the durability of a company's competitive advantage and its ability to reinvest capital at high rates of return.
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <Card className="border-blue-100 mb-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              What I Do
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fundamental Research</h3>
                <p className="text-gray-600">
                  I conduct deep-dive research into company fundamentals, industry dynamics, and management quality.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Portfolio Management</h3>
                <p className="text-gray-600">
                  I construct a concentrated portfolio of my highest conviction ideas, managing risk through quality rather than broad diversification.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparent Reporting</h3>
                <p className="text-gray-600">
                  I believe in transparency. I share my investment theses, performance metrics, and market commentary with my stakeholders.
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
              For inquiries, please contact me at:
            </p>
            <div className="space-y-2 text-gray-600">
              <p>Email: rish@rishinvests.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}