"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Target, Globe } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Twenty 20 Capital · Capital Appreciation Fund</h1>
            <p className="text-gray-600">Private institutional tooling for the capital appreciation mandate. Admin access only.</p>
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
                Maintain a disciplined, high-conviction portfolio with tight telemetry around NAV, volatility, and liquidity. The
                Capital Appreciation Fund focuses on durable businesses and pairs that conviction with operational rigor—fast
                reporting, cache-aware data, and explicit compliance guardrails.
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
                Twenty 20 Capital is a small, global team of operators and analysts. We run the fund hands-on, so the tooling you
                see here is designed for real work: committee prep, compliance reviews, and exposure management.
              </p>
              <p className="text-gray-600 leading-relaxed">
                The console aggregates trades, research, and risk notes into one place. Everyone touching the strategy uses the
                same dashboards, the same data, and the same disclosures.
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
                  <h3 className="font-semibold text-gray-900 mb-2">Fund Oversight</h3>
                <p className="text-gray-600">
                    Daily monitoring of NAV, risk budgets, FX exposure, and benchmark deltas. Data is cached intelligently and
                    masked on demand when sharing snapshots.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
                <p className="text-gray-600">
                    Research notes, news scrapes, and company-specific dashboards feed directly into decision making. Analysts
                    can move from thesis to sizing without juggling spreadsheets.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Portfolio Insights</h3>
                <p className="text-gray-600">
                    Scenario analysis, exited-position retrospectives, and reporting packages for LP updates all live here. Every
                    component reinforces that this is informational only—not investment advice, not a solicitation.
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
                This site is informational. The Capital Appreciation Fund is private and not accepting outside investment. If
                you’re an existing partner, use your normal secure channels to reach the team.
              </p>
              <div className="space-y-2 text-gray-600 text-sm">
                <p>Compliance & Ops: compliance@twenty20capital.com</p>
                <p>General Inquiries: info@twenty20capital.com</p>
                <p>Media: media@twenty20capital.com</p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Nothing on this page is investment advice or an offer to sell securities.
              </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}