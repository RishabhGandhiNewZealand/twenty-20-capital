import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Target, TrendingUp, BookOpen, Mail, Calendar } from "lucide-react"

export default function AboutPage() {
  const milestones = [
    { year: "2020", event: "Started investing journey with first stock purchase" },
    { year: "2021", event: "Diversified into ETFs and international markets" },
    { year: "2022", event: "Weathered market volatility, learned risk management" },
    { year: "2023", event: "Focused on quality companies and long-term growth" },
    { year: "2024", event: "Achieved 24% annual return through disciplined approach" },
    { year: "2025", event: "Continuing to build wealth through strategic investing" },
  ]

  const principles = [
    {
      title: "Long-term Focus",
      description: "Investing with a 5-10 year horizon, avoiding short-term market noise",
      icon: Target,
    },
    {
      title: "Continuous Learning",
      description: "Constantly educating myself about markets, companies, and investment strategies",
      icon: BookOpen,
    },
    {
      title: "Risk Management",
      description: "Diversification and position sizing to protect capital while seeking growth",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About My Investment Journey</h1>
          <p className="text-gray-600">Learn about my approach to investing and wealth building</p>
        </div>

        {/* Introduction */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              My Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Welcome to my personal investment tracking website! I started this journey in 2020 with a simple goal:
                to build long-term wealth through disciplined investing and continuous learning.
              </p>
              <p className="mb-4">
                What began as a curiosity about the stock market has evolved into a systematic approach to portfolio
                management, combining fundamental analysis with risk management principles. This website serves as both
                a personal record and a way to share insights from my investing experience.
              </p>
              <p>
                I believe in transparency and accountability in investing, which is why I document both successes and
                failures. Every investment decision is a learning opportunity, and I hope my journey can provide value
                to others on similar paths.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Philosophy */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Investment Philosophy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {principles.map((principle) => {
                const Icon = principle.icon
                return (
                  <div key={principle.title} className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{principle.title}</h3>
                    <p className="text-sm text-gray-600">{principle.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Investment Journey Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="flex items-start">
                  <div className="flex-shrink-0 w-20">
                    <span className="inline-flex items-center justify-center w-16 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Focus */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Current Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Investment Sectors</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Technology and software companies</li>
                  <li>• Healthcare and biotechnology</li>
                  <li>• Renewable energy and sustainability</li>
                  <li>• Financial services and fintech</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Research Methods</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Fundamental analysis and financial modeling</li>
                  <li>• Industry and competitive analysis</li>
                  <li>• Management quality assessment</li>
                  <li>• Valuation and risk analysis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              Get In Touch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              I'm always interested in discussing investment ideas, market trends, and learning from other investors.
              Feel free to reach out if you'd like to connect!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:investor@example.com"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
              <p className="text-sm text-gray-500 flex items-center">
                Always open to learning and sharing investment insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
