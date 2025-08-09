"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartLine, Code2, Database, Globe, Zap, Shield, TrendingUp, ArrowRight, Cpu, Cloud, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const technicalHighlights = [
    {
      icon: Zap,
      title: "Real-time Market Data",
      description: "Yahoo Finance API integration for live stock prices and exchange rates",
      details: "Implemented intelligent caching with 5-minute intervals for price updates, reducing API calls by 80% while maintaining data freshness"
    },
    {
      icon: Database,
      title: "Multi-tier Caching Architecture",
      description: "PostgreSQL with Neon for trade data, Vercel Blob for static assets",
      details: "Designed a sophisticated caching system with different TTLs: 1 hour for trade data, 20 minutes for portfolio compositions, and 5 minutes for live prices"
    },
    {
      icon: Globe,
      title: "Multi-currency Support",
      description: "Automatic conversion between USD and NZD with real-time exchange rates",
      details: "Built a currency conversion system that handles multiple brokers (Sharesies, Interactive Brokers) with different base currencies seamlessly"
    },
    {
      icon: BarChart3,
      title: "Performance Benchmarking",
      description: "S&P 500 comparison with CAGR calculations and historical tracking",
      details: "Developed algorithms to calculate time-weighted returns and compare portfolio performance against market benchmarks since inception"
    },
    {
      icon: Cloud,
      title: "Edge Computing",
      description: "Vercel Edge Functions for optimal global performance",
      details: "Leveraged edge computing for API routes, reducing latency by serving data from locations closest to users"
    },
    {
      icon: Shield,
      title: "Type-safe Architecture",
      description: "Full TypeScript implementation with strict type checking",
      details: "Comprehensive type definitions for all data structures, ensuring compile-time safety and better developer experience"
    }
  ]

  const journeySteps = [
    {
      number: "01",
      title: "The Problem",
      content: "Managing investments across multiple brokers meant constantly switching between platforms, manually calculating returns, and losing track of the big picture."
    },
    {
      number: "02",
      title: "The Vision",
      content: "A unified dashboard that brings together all my investments, shows real-time performance, and helps me make informed decisions at a glance."
    },
    {
      number: "03",
      title: "The Build",
      content: "Leveraging modern web technologies to create a fast, reliable, and beautiful investment tracking experience."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100/[0.03] dark:bg-grid-gray-100/[0.01]" />
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100">
              From Scattered Spreadsheets to
              <span className="text-blue-600 dark:text-blue-400"> Unified Insights</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              I built a personal investment portfolio tracker to solve my own problem: getting a concise, 
              unified view of investments across multiple brokers while growing my technical skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/portfolio">
                <Button size="lg" className="group">
                  View Live Portfolio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#technical-deep-dive">
                <Button size="lg" variant="outline">
                  <Code2 className="mr-2 h-4 w-4" />
                  Technical Deep Dive
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            The Journey
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {journeySteps.map((step, index) => (
              <Card key={index} className="border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 opacity-20 mb-4">
                    {step.number}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{step.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              What I Built
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A comprehensive investment tracking platform that brings together data from multiple sources 
              into a single, actionable view.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-4">
                <ChartLine className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg">Real-time Portfolio Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Live market data updates every 5 minutes during trading hours
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  CAGR calculations and S&P 500 benchmark comparisons
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-4">
                <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-lg">Multi-broker Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Unified view across Sharesies and Interactive Brokers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive Section */}
      <section id="technical-deep-dive" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Technical Architecture
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built with modern web technologies and best practices to ensure performance, 
              reliability, and maintainability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{highlight.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {isActive && (
                    <CardContent className="pt-0">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Tech Stack</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Next.js 15", "TypeScript", "Tailwind CSS", "PostgreSQL", 
                "Vercel", "Recharts", "Yahoo Finance API", "Neon Database"
              ].map((tech) => (
                <span 
                  key={tech}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Explore?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Dive into the live portfolio dashboard or check out the technical implementation details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" variant="secondary" className="group">
                View Portfolio Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                Learn More About Me
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}