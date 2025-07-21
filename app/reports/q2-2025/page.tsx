import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ReportQ2_2025() {
  const portfolioHoldings = [
    { symbol: "AAPL", name: "Apple Inc.", allocation: "20%", value: "$29,640", return: "+2.3%" },
    { symbol: "MSFT", name: "Microsoft Corp.", allocation: "20%", value: "$29,640", return: "+13.0%" },
    { symbol: "GOOGL", name: "Alphabet Inc.", allocation: "16%", value: "$23,712", return: "+7.4%" },
    { symbol: "NVDA", name: "NVIDIA Corp.", allocation: "14%", value: "$20,748", return: "+15.7%" },
    { symbol: "PLTR", name: "Palantir Technologies", allocation: "10%", value: "$14,820", return: "+19.3%" },
    { symbol: "AMZN", name: "Amazon.com Inc.", allocation: "8%", value: "$11,856", return: "-4.6%" },
    { symbol: "META", name: "Meta Platforms", allocation: "7%", value: "$10,374", return: "-6.0%" },
    { symbol: "TSLA", name: "Tesla Inc.", allocation: "5%", value: "$7,410", return: "-40.4%" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Q2 2025 Report</h1>
        <p className="text-gray-600">Second quarter performance and portfolio restructuring</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Starting Value:</span>
                <span className="font-medium">$138,010</span>
              </div>
              <div className="flex justify-between">
                <span>Ending Value:</span>
                <span className="font-medium">$148,200</span>
              </div>
              <div className="flex justify-between">
                <span>Quarterly Return:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  +7.4%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>S&P 500 Return:</span>
                <span className="font-medium">+5.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Holdings Count:</span>
                <span className="font-medium">8 (unchanged)</span>
              </div>
              <div className="flex justify-between">
                <span>New Positions:</span>
                <span className="font-medium">PLTR added</span>
              </div>
              <div className="flex justify-between">
                <span>Eliminated:</span>
                <span className="font-medium">NFLX sold</span>
              </div>
              <div className="flex justify-between">
                <span>Reduced:</span>
                <span className="font-medium">TSLA trimmed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Portfolio Holdings at Quarter End</CardTitle>
          <CardDescription>Position breakdown as of June 30, 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioHoldings.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">{holding.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium">{holding.name}</p>
                    <p className="text-sm text-gray-600">{holding.allocation} of portfolio</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{holding.value}</p>
                  <Badge
                    variant={holding.return.startsWith("+") ? "default" : "destructive"}
                    className={holding.return.startsWith("+") ? "bg-green-100 text-green-800" : ""}
                  >
                    {holding.return}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="prose max-w-none">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Q2 2025 was marked by significant portfolio restructuring, with the addition of Palantir Technologies and
              the complete exit from Netflix. The portfolio returned 7.4%, outperforming the S&P 500 by 2.3 percentage
              points despite some headwinds from Tesla's continued decline.
            </p>
            <p>
              The quarter saw increased market volatility around AI regulation and geopolitical tensions, but core
              technology holdings demonstrated resilience. The decision to add Palantir reflects confidence in the
              company's government contracts and enterprise AI adoption trajectory.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apple Inc. (AAPL) - 20% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Apple's 2.3% gain was modest but reflected stability during a volatile quarter. The company's AI features
              gained traction with developers, and services revenue continued its steady growth trajectory.
            </p>
            <p>
              Despite near-term headwinds in China, Apple's long-term positioning in AI, augmented reality, and services
              supports maintaining the position as a core holding.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Microsoft Corporation (MSFT) - 20% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Microsoft's strong 13.0% return was driven by exceptional Azure growth and widespread Copilot adoption.
              The company emerged as the clear leader in enterprise AI solutions, justifying the increased allocation to
              match Apple's weight.
            </p>
            <p>
              Enterprise customers continue to consolidate their AI spending with Microsoft, creating a powerful
              flywheel effect that should drive long-term growth.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alphabet Inc. (GOOGL) - 16% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Google's 7.4% return reflected steady progress in AI integration across its product suite. Search remained
              resilient, while cloud services benefited from increased AI workload demand.
            </p>
            <p>
              The company's massive investment in AI infrastructure is beginning to show returns, with Gemini models
              gaining enterprise adoption and improving search capabilities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NVIDIA Corporation (NVDA) - 14% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              NVIDIA's 15.7% gain continued its impressive run, supported by strong demand for Blackwell architecture
              chips and expanding AI inference market. The company's technological moat remains intact.
            </p>
            <p>
              While competition is increasing, NVIDIA's software ecosystem and performance advantages maintain its
              leadership position in AI acceleration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palantir Technologies (PLTR) - 10% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Palantir was added to the portfolio during the quarter and delivered an impressive 19.3% return. The
              company's government contracts provide stable revenue, while enterprise adoption of its AI platform is
              accelerating.
            </p>
            <p>
              The investment thesis centers on Palantir's unique position in data analytics and AI, with strong
              competitive moats in government and defense sectors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amazon.com Inc. (AMZN) - 8% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Amazon declined 4.6% during the quarter due to concerns about cloud growth deceleration and increased
              competition in AI services. However, the retail business continued to show margin expansion.
            </p>
            <p>
              The position was reduced slightly to fund the Palantir investment, but AWS remains a valuable long-term
              asset with strong competitive positioning.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Platforms (META) - 7% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Meta's 6.0% decline reflected concerns about advertising growth and continued Reality Labs losses.
              However, the company's AI initiatives in content recommendation and ad targeting showed promise.
            </p>
            <p>
              The position was reduced to fund higher-conviction opportunities, though Meta's core advertising business
              remains strong and profitable.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tesla Inc. (TSLA) - 5% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Tesla's significant 40.4% decline was the quarter's biggest disappointment, driven by increased EV
              competition, margin pressure, and concerns about autonomous driving progress. The position was
              substantially reduced.
            </p>
            <p>
              While maintaining a small position for potential upside from Full Self-Driving breakthroughs, the reduced
              allocation reflects diminished confidence in near-term prospects.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist and Future Considerations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Following the portfolio restructuring, several companies remain under consideration for future addition:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Advanced Micro Devices (AMD)</strong> - Competitive AI chip offerings with improving market
                position
              </li>
              <li>
                <strong>ServiceNow (NOW)</strong> - Enterprise workflow automation with strong AI integration
              </li>
              <li>
                <strong>Snowflake (SNOW)</strong> - Data cloud platform benefiting from AI data requirements
              </li>
              <li>
                <strong>CrowdStrike (CRWD)</strong> - Cybersecurity leader with AI-powered threat detection
              </li>
            </ul>
            <p>
              These companies offer exposure to high-growth technology sectors while maintaining the portfolio's quality
              and growth focus.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Thoughts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Q2 2025 demonstrated the importance of active portfolio management and willingness to make difficult
              decisions. The exit from Netflix and reduction in Tesla, while painful, freed up capital for
              higher-conviction opportunities like Palantir.
            </p>
            <p>
              The portfolio's technology focus continues to benefit from AI adoption trends, though increased
              selectivity and risk management are essential given market volatility. The addition of Palantir provides
              exposure to the government and defense AI market, diversifying beyond consumer technology.
            </p>
            <p>
              Looking ahead, the focus remains on companies with strong competitive positions, clear AI strategies, and
              sustainable business models. Market conditions may provide opportunities to add new positions or increase
              allocations to existing holdings at attractive valuations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
