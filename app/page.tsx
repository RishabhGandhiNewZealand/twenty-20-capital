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
      icon: Zap,
      title: "Live Market Data",
      description: "Yahoo Finance API integration with smart caching",
      details: "Built a caching layer that updates prices every 5 minutes during market hours. This cut API calls by 80% without sacrificing data freshness."
    },
    {
      icon: Database,
      title: "Smart Caching Strategy",
      description: "PostgreSQL with Neon for fast data access",
      details: "Different cache durations for different data types: 1 hour for trades, 20 minutes for compositions, 5 minutes for prices. It just works."
    },
    {
      icon: Globe,
      title: "Multi-currency Support",
      description: "Handles USD and NZD seamlessly",
      details: "Automatic currency conversion with real-time exchange rates. Everything displayed in your preferred currency."
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Compare against the S&P 500",
      details: "Calculate CAGR, track historical performance, and see how you're doing against the market benchmark. No more guesswork."
    },
    {
      icon: Shield,
      title: "Modern Tech Stack",
      description: "TypeScript, React, SQL, and Python working together",
      details: "TypeScript for type-safe frontend and backend code. React with Next.js for the UI. PostgreSQL for reliable data storage. Python scripts for data processing and automation. Everything integrated seamlessly."
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
              <span className="text-blue-600 dark:text-blue-400"> Capital Appreciation Fund</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A concentrated, high-conviction investment fund focused on quality businesses
              with sustainable competitive advantages and exceptional long-term growth potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/portfolio">
                <Button size="lg" className="group">
                  View Portfolio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  <Code2 className="mr-2 h-4 w-4" />
                  Investment Thesis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Philosophy Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Investment Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                We focus on building concentrated positions in exceptional businesses with sustainable competitive advantages.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400"><strong>Quality First:</strong> We invest in businesses with strong moats, pricing power, and consistent returns on capital</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400"><strong>Long-Term Focus:</strong> Our holding period is measured in years, not months, allowing compound returns to work their magic</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400"><strong>Concentrated Portfolio:</strong> High conviction positions in our best ideas, typically 8-15 holdings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400"><strong>Full Transparency:</strong> Complete visibility into our portfolio, trades, and performance versus the S&P 500</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-blue-200 dark:border-gray-700">
                <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
                  Track our journey as we aim to outperform the market through patient, disciplined investing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>



      {/* Key Features Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              Performance & Transparency
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Track our fund's performance with complete transparency
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <ChartLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base">Real-Time Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Live portfolio valuations updated throughout trading hours
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                <CardTitle className="text-base">Benchmark Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track performance vs S&P 500 with detailed CAGR analysis
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">Complete Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Every position, entry price, and allocation publicly visible
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-base">Full Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All trades, gains, losses, and exited positions disclosed
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
            Explore the Capital Appreciation Fund
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            View our complete portfolio holdings, performance metrics, and investment analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" variant="secondary" className="group">
                View Portfolio
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                About Twenty 20 Capital
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}