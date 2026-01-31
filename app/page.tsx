"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap, DollarSign, Users, Target, BookOpen, Building, ArrowRight, BarChart3, Globe, Brain } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const buySellCriteria = [
    {
      type: "Buy",
      criteria: [
        "Compounding machines trading below intrinsic value with margin of safety",
        "High quality companies even if slightly overpriced (quality over valuation)",
        "Optionality plays ('The Tail') when potential payoff is asymmetric",
        "Companies possessing Structural Power + Financial Discipline"
      ]
    },
    {
      type: "Sell",
      criteria: [
        "Mistake in original analysis - cut losses and move on",
        "Company no longer meets quality/power standards",
        "Company begins to extract too much value (Zero Sum) from ecosystem",
        "Far more attractive opportunity in similar or better quality company"
      ]
    }
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
              <Link href="#philosophy">
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

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

        {/* Goal Section (Moved from Thesis) */}
        <section>
          <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-900 dark:text-gray-100">
                <Target className="h-6 w-6 text-blue-600 mr-3" />
                Investment Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                To avoid permanent capital loss and achieve superior returns relative to the S&P 500 over the long term.
                Success is measured not by quarterly fluctuations, but by multi-year compounding of capital (~+5% vs Index).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Philosophy Section (Updated from 2025 Report) */}
        <section id="philosophy" className="scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Investment Philosophy</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              From Prediction to Adaptation: Blending Financial Discipline with Complexity Science.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-gray-50 dark:bg-gray-900 border-none">
              <CardContent className="pt-6 prose dark:prose-invert">
                <h3 className="font-semibold text-lg mb-2">The Core Shift</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Markets are not predictable machines; they are complex biological ecosystems.
                  We cannot predict the future with certainty. Therefore, we own high-quality businesses that balance
                  <strong> Resilience (Safety)</strong> and <strong>Optionality (Upside)</strong>.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  To be considered, a company must demonstrate strength across three pillars:
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  1. Strategic Power (The Moat)
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  We demand at least one of Hamilton Helmer’s 7 Powers to structurally prevent arbitrage:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc pl-4">
                  <li><strong>Scale Economies:</strong> Unmatchable unit economics (e.g., Netflix).</li>
                  <li><strong>Network Economies:</strong> Value grows with users (e.g., LinkedIn).</li>
                  <li><strong>Counter-Positioning:</strong> Business models incumbents can't copy.</li>
                  <li><strong>Switching Costs:</strong> High friction to leave (e.g., SAP).</li>
                  <li><strong>Branding:</strong> Durable pricing power (e.g., Tiffany).</li>
                  <li><strong>Cornered Resource:</strong> Coveted assets (e.g., Patents).</li>
                  <li><strong>Process Power:</strong> Complex, hard-to-copy efficiency (e.g., Toyota).</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  2. Financial Discipline (The Engine)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  The business must exhibit at least 3 of these 4 characteristics:
                </p>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Organic Growth:</span> Long runway, large TAM, internal innovation.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Operating Leverage:</span> Revenue grows faster than costs.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Capital Light:</span> Efficient growth without heavy Capex.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Predictability:</span> Consistent long-term cash flows.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  3. Complexity Characteristics (Adaptability)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Qualities that allow survival in uncertainty:
                </p>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Non-Zero Sum (NZS):</span> Creates value for all stakeholders (win-win).
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">S-Curve Duration:</span> Stacking new growth curves; long-duration growth.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">Adaptability:</span> Management as capital allocators; decentralized decision making.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Portfolio Construction (Barbell) */}
        <section>
          <Card className="border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Building className="h-6 w-6 mr-3 text-slate-800 dark:text-slate-100" />
                Portfolio Construction: The Barbell Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We balance Resilience with Optionality to maximize the probability of "getting lucky" while preventing ruin.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">The Head (Resilience + Optionality)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">High Concentration (~70% of assets, ~10 companies)</p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>High-conviction "Compounding Machines".</li>
                    <li>Meet Strategic Power + Financial Discipline criteria.</li>
                    <li>Positions &gt;12% reserved for rare mispriced resilience.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">The Tail (Pure Optionality)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">High Diversification (~20-30 companies, &lt;2% each)</p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Earlier-stage "moonshots" or high-upside plays.</li>
                    <li>We buy a "basket" to expose portfolio to positive Black Swans.</li>
                    <li>Maximize surface area for luck.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-center text-red-600 dark:text-red-400">
                  We aggressively avoid "The Middle": Average companies that are neither highly resilient nor highly optional.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Emotional Intelligence */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Brain className="h-6 w-6 mr-3 text-pink-600" />
              Emotional Intelligence & Discipline
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Investing successfully requires excellent emotional control. We avoid speculation and FOMO through disciplined criteria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {buySellCriteria.map((section) => (
              <Card key={section.type} className={`border ${section.type === 'Buy' ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                <CardHeader>
                  <CardTitle className={`${section.type === 'Buy' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                    }`}>
                    {section.type} Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={`space-y-2 text-sm ${section.type === 'Buy' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                    {section.criteria.map((criterion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* Fund Highlights (Existing) */}
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

      {/* CTA Section (Existing) */}
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