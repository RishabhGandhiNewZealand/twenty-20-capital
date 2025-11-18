"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartLine, Code2, Database, Globe, Zap, Shield, TrendingUp, ArrowRight, BarChart3, Eye } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

    const technicalHighlights = [
      {
        icon: Shield,
        title: "Admin-Gated Middleware",
        description: "Stack authentication enforced globally",
        details: "Middleware checks Stack sessions and the admin email before any page or API responds, so private NAV data never leaks."
      },
      {
        icon: Database,
        title: "Deterministic Cache Layers",
        description: "Different TTLs for NAV, trades, and research",
        details: "Portfolio values refresh every five minutes, compositions every twenty, and trades hourly—balanced latency with provider limits."
      },
      {
        icon: Globe,
        title: "Currency & Benchmark Engine",
        description: "NZD base with FX and S&P overlays",
        details: "Holdings normalize to NZD, then benchmarked against the S&P 500 so committee reviews see alpha vs. beta in real time."
      },
      {
        icon: BarChart3,
        title: "Trade Ledger + Anonymization",
        description: "Full CRUD with masking controls",
        details: "Detailed trade forms, staging, and masking toggles mean screenshots stay compliant without touching the source of truth."
      },
      {
        icon: Zap,
        title: "Operational Runbooks",
        description: "Scripts for cache warmups and verification",
        details: "Custom scripts warm caches, verify fixes, and prepare deployments so reviews stay smooth even on volatile weeks."
      }
    ]



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100/[0.03] dark:bg-grid-gray-100/[0.01]" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative">
            <div className="text-center space-y-6">
              <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100">
                Twenty 20 Capital
                <span className="text-blue-600 dark:text-blue-400"> Capital Appreciation Fund Console</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Internal operating system for investment committee, risk, and operations. Real-time NAV, exposures, and trade
                flow for the Capital Appreciation Fund. Admin access only.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/capital-appreciation-fund">
                  <Button size="lg" className="group">
                    Enter Fund Console
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#technical-deep-dive">
                  <Button size="lg" variant="outline">
                    <Code2 className="mr-2 h-4 w-4" />
                    Review Controls
                  </Button>
                </Link>
              </div>
            </div>
        </div>
      </section>

      {/* Motivation Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4">
            <Card className="border-2 border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  Why the Capital Appreciation Fund Needs Its Own Control Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Institutional-grade reporting, but sized for a focused private fund. This console replaces spreadsheets,
                  ad-hoc exports, and brittle broker tooling.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                    <span className="text-gray-600 dark:text-gray-400">Real-time NAV context: exposures, benchmark drift, and currency impact in one view.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                    <span className="text-gray-600 dark:text-gray-400">Policy guardrails: admin-only authentication, anonymization toggles, and cache-aware data refreshes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                    <span className="text-gray-600 dark:text-gray-400">Operational readiness: trades, reports, and research stitched together for committee prep.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                    <span className="text-gray-600 dark:text-gray-400">Compliance-ready: private fund disclosures, audit trails, and explicit “not open for investment” language everywhere.</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-orange-200 dark:border-gray-700">
                <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
                    It’s a single source of truth for the Twenty 20 Capital team—fast, private, and purpose-built for internal use.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>



      {/* Key Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              What It Does
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Everything I needed to track my investments properly
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                  <ChartLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-base">Live NAV + FX Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Market data refreshes every five minutes during trading hours with currency translation baked in.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-base">Benchmark Discipline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Instant CAGR, drawdown, and S&P 500 overlays to keep committee reviews grounded in data.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-base">Exposure & Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Allocation, currency, and sector views drive faster rebalance and hedging decisions.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                  <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <CardTitle className="text-base">Evidence Trail</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Disclosures embedded everywhere—“not investment advice”, “private fund”, and audit-friendly histories.
                  </p>
                </CardContent>
              </Card>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive Section */}
      <section id="technical-deep-dive" className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              The Technical Bits
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Some interesting problems I solved along the way
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {technicalHighlights.map((highlight, index) => {
              const Icon = highlight.icon
              const isActive = activeSection === highlight.title
              
              return (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all ${
                    isActive ? 'ring-2 ring-blue-600 dark:ring-blue-400' : 'hover:shadow-lg'
                  }`}
                  onClick={() => setActiveSection(isActive ? null : highlight.title)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{highlight.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {isActive && (
                    <CardContent className="pt-0">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {highlight.details}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Tech Stack */}
          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Built With</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Next.js 15", "TypeScript", "Tailwind CSS", "PostgreSQL", 
                "Vercel", "Recharts", "Yahoo Finance API", "Cursor", "Claude"
              ].map((tech) => (
                <span 
                  key={tech}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Capital Appreciation Fund · Internal Access Only
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              If you are part of the Twenty 20 Capital team, sign in to access the latest fund data. Everyone else—this is
              not an offer, not investment advice, and the fund is not open for investment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="group">
                  Admin Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/about-us">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                  Read Our Disclosures
                </Button>
              </Link>
            </div>
          </div>
        </section>
    </div>
  )
}