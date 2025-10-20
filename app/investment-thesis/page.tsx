import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp, BookOpen, Shield, Zap, Building, Brain, DollarSign, Users } from "lucide-react"

export default function InvestmentThesisPage() {
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
      description: "Long runway of growth without significant acquisitions, large TAM through internal developments",
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
      description: "Effective use of capital on buybacks, dividends, and smaller acquisitions",
      icon: Users,
    },
  ]

  const buySellCriteria = [
    {
      type: "Buy",
      criteria: [
        "Compounding machines trading below intrinsic value with margin of safety",
        "High quality companies even if slightly overpriced (quality over valuation)",
        "Companies possessing 5 out of 6 quality factors"
      ]
    },
    {
      type: "Sell",
      criteria: [
        "Made a mistake in original analysis - cut losses and move on",
        "Company no longer meets quality standards",
        "Far more attractive opportunity in similar or better quality company"
      ]
    }
     ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About My Investment Journey</h1>
          <p className="text-gray-600">Building wealth through focused, quality investing over 40+ years</p>
        </div>

        {/* Goal */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              Investment Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4 text-lg font-medium text-gray-900">
                Avoid permanent capital loss and achieve a +5% return on the S&P 500 for the next 40+ years.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Key Metrics & Approach:</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>Benchmark:</strong> S&P 500 comparison on total value CAGR basis</li>
                  <li>• <strong>Capital Contribution:</strong> Majority of savings</li>
                  <li>• <strong>Time Horizon:</strong> 40+ years of consistent investing</li>
                  <li>• <strong>Focus:</strong> Capital preservation with superior long-term returns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Philosophy */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
              Investment Philosophy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700 mb-6">
              <p className="text-lg">
                Own high-quality businesses, purchase them at reasonable prices, and hold them for an extended period 
                while they remain excellent companies.
              </p>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-4">Six Qualities of Effective Compounding Machines:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qualityFactors.map((factor) => {
                const Icon = factor.icon
                return (
                  <div key={factor.title} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Icon className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">{factor.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                <strong>Requirements:</strong> Companies must possess <strong>5 out of 6</strong> qualities for portfolio consideration. 
                The most crucial factors are <strong>organic growth</strong> and <strong>operating leverage</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Construction */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              Portfolio Construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Structure & Size</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Target:</strong> 8-12 companies (max 15)</li>
                  <li>• <strong>Weighting:</strong> No cap on individual holdings</li>
                  <li>• <strong>Flexibility:</strong> Based on fundamentals and valuations</li>
                  <li>• <strong>Focus:</strong> Quality over diversification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Strategic Benefits</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Easier to track performance and narratives</li>
                  <li>• Focus limited time on understanding fewer companies</li>
                  <li>• Forces evaluation: add to existing vs. replace vs. new</li>
                  <li>• Higher outperformance potential with concentrated bets</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emotional Intelligence */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              Emotional Intelligence & Discipline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700 mb-6">
              <p>
                Successful investing requires excellent emotional control and temperament. Avoid speculation, gambling, 
                or investing due to FOMO or hype through disciplined buy and sell criteria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {buySellCriteria.map((section) => (
                <div key={section.type} className={`border rounded-lg p-4 ${
                  section.type === 'Buy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className={`font-semibold mb-3 ${
                    section.type === 'Buy' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {section.type} Criteria
                  </h3>
                  <ul className={`space-y-2 text-sm ${
                    section.type === 'Buy' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {section.criteria.map((criterion, index) => (
                      <li key={index}>• {criterion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 italic">
                "I doubt I will achieve this with 100% consistency, but hopefully I will realize and learn from my mistakes."
              </p>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
