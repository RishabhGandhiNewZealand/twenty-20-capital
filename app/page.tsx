"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap, DollarSign, Users, Target, BookOpen, Building, ArrowRight, BarChart3, Globe } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const qualityFactors = [
    {
      title: "Wide Moat",
      description: "Allows the company to defend against competitive threats",
      icon: Shield,
    },
    {
      title: "Operating Leverage",
      description: "Ability to increase revenue faster than costs through economies of scale",
      icon: TrendingUp,
    },
    {
      title: "Organic Growth",
      description: "Long runway of growth without significant acquisitions",
      icon: Zap,
    },
    {
      title: "Capital Light",
      description: "Does not require substantial capex and R&D to generate growth",
      icon: DollarSign,
    },
    {
      title: "Predictability",
      description: "Consistent stream of cash flows over the long term",
      icon: TrendingUp,
    },
    {
      title: "Smart Management",
      description: "Effective use of capital on buybacks, dividends, and acquisitions",
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 bg-grid-gray-100/[0.03] dark:bg-grid-gray-100/[0.01]" />
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              RishInvests
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Disciplined Capital Appreciation through Focused Investing in Quality Compounding Machines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/appreciation-fund">
                <Button size="lg" className="h-12 px-8 text-base">
                  View Portfolio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#strategy">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  My Strategy
                </Button>
              </Link>
              <Link href="/multi-agent-pm">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  Agent PM
                  <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Philosophy / Strategy Section */}
      <section id="strategy" className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Investment Philosophy</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              I own high-quality businesses, purchase them at reasonable prices, and hold them for an extended period
              while they remain excellent companies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {qualityFactors.map((factor) => {
              const Icon = factor.icon
              return (
                <Card key={factor.title} className="border-none shadow-sm bg-gray-50 dark:bg-gray-900/50">
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-block p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{factor.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{factor.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  My Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  To avoid permanent capital loss and achieve superior returns relative to the S&P 500 over the long term.
                  I measure success not by quarterly fluctuations, but by multi-year compounding of capital.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Portfolio Construction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-600">•</span>
                    Concentrated portfolio of 8-12 high-conviction companies
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-600">•</span>
                    Unconstrained weighting based on fundamentals
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-600">•</span>
                    Focus on quality over broad diversification
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fund Highlights */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent Performance</h3>
              <p className="text-gray-600 dark:text-gray-400">
                I track and publish my performance metrics, including CAGR and total returns, compared against the S&P 500 benchmark.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Perspective</h3>
              <p className="text-gray-600 dark:text-gray-400">
                My mandate allows me to invest in the best businesses globally, regardless of geography, though I primarily focus on developed markets.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Detailed Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">
                I publish my investment theses and research, providing transparency into my decision-making process.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/appreciation-fund">
              <Button size="lg" className="px-8">
                Explore the Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Follow my latest market commentary and portfolio updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyses">
              <Button variant="outline" size="lg">
                View Analyses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}