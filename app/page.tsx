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
      title: "TypeScript Everything",
      description: "Type-safe from database to UI",
      details: "Full TypeScript coverage means fewer bugs and better code completion. The compiler catches issues before they hit production."
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
              I Got Tired of Spreadsheets
              <span className="text-blue-600 dark:text-blue-400"> So I Built This</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A portfolio tracker that actually shows me what I need to know. 
              One place for all my investments with the metrics that matter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/portfolio">
                <Button size="lg" className="group">
                  See the Portfolio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#technical-deep-dive">
                <Button size="lg" variant="outline">
                  <Code2 className="mr-2 h-4 w-4" />
                  How It's Built
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
                Why Existing Solutions Weren't Enough
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                I tried them all. Free tools, premium subscriptions, broker dashboards. They all fell short.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400">Most trackers show you numbers but not the story. Where's my CAGR? How am I doing vs the market?</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400">Premium tools cost $20+/month and still left me feeling like something was missing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400">No way to share my progress publicly. I wanted transparency in my investing journey</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-3 text-lg">▸</span>
                  <span className="text-gray-600 dark:text-gray-400">Cookie-cutter dashboards that don't show what actually matters to me</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-orange-200 dark:border-gray-700">
                <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
                  So I built exactly what I wanted. And now it's public for everyone to see.
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
                <CardTitle className="text-base">Live Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Prices refresh every 5 minutes when markets are open
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                <CardTitle className="text-base">Real Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  CAGR, total returns, and S&P 500 comparison
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">Unified View</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All investments in one clean, organized dashboard
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
                  My investing journey, wins and losses, all public
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
                "Vercel", "Recharts", "Yahoo Finance API", "Neon Database"
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
            Want to See It in Action?
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            Check out the live portfolio or learn more about how it works.
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
                About Me
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}