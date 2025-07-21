import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ReportQ1_2025() {
  const portfolioHoldings = [
    { symbol: "AAPL", name: "Apple Inc.", allocation: "21%", value: "$28,980", return: "+5.0%" },
    { symbol: "MSFT", name: "Microsoft Corp.", allocation: "19%", value: "$26,220", return: "+16.1%" },
    { symbol: "GOOGL", name: "Alphabet Inc.", allocation: "16%", value: "$22,070", return: "+17.3%" },
    { symbol: "NVDA", name: "NVIDIA Corp.", allocation: "13%", value: "$17,940", return: "+19.2%" },
    { symbol: "TSLA", name: "Tesla Inc.", allocation: "9%", value: "$12,430", return: "-0.9%" },
    { symbol: "AMZN", name: "Amazon.com Inc.", allocation: "9%", value: "$12,430", return: "+23.8%" },
    { symbol: "META", name: "Meta Platforms", allocation: "8%", value: "$11,040", return: "+10.0%" },
    { symbol: "NFLX", name: "Netflix Inc.", allocation: "5%", value: "$6,900", return: "-21.4%" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Q1 2025 Report</h1>
        <p className="text-gray-600">First quarter performance review and portfolio updates</p>
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
                <span className="font-medium">$125,430</span>
              </div>
              <div className="flex justify-between">
                <span>Ending Value:</span>
                <span className="font-medium">$138,010</span>
              </div>
              <div className="flex justify-between">
                <span>Quarterly Return:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  +10.0%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>S&P 500 Return:</span>
                <span className="font-medium">+8.2%</span>
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
                <span>Largest Position:</span>
                <span className="font-medium">AAPL (21%)</span>
              </div>
              <div className="flex justify-between">
                <span>New Positions:</span>
                <span className="font-medium">None</span>
              </div>
              <div className="flex justify-between">
                <span>Position Adjustments:</span>
                <span className="font-medium">NFLX reduced</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Portfolio Holdings at Quarter End</CardTitle>
          <CardDescription>Position breakdown as of March 31, 2025</CardDescription>
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
              The first quarter of 2025 delivered solid returns of 10.0%, outperforming the S&P 500 by 1.8 percentage
              points. The portfolio benefited from continued strength in AI-related stocks and strong earnings from core
              technology holdings.
            </p>
            <p>
              Market volatility increased during the quarter due to concerns about AI regulation and interest rate
              policy, but the portfolio's quality companies demonstrated resilience. One position adjustment was made,
              reducing Netflix exposure to fund potential new opportunities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apple Inc. (AAPL) - 21% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Apple's modest 5.0% gain reflected mixed sentiment around iPhone sales in China and the pace of AI feature
              rollout. However, the company's services business continued to show strength, and early Apple Intelligence
              adoption metrics were encouraging.
            </p>
            <p>
              The position remains the portfolio's largest holding given Apple's strong balance sheet, dividend growth,
              and long-term positioning in AI and augmented reality markets.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Microsoft Corporation (MSFT) - 19% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Microsoft's strong 16.1% quarterly return was driven by excellent Azure growth and increasing Copilot
              adoption across enterprise customers. The company's AI integration strategy continued to show clear
              business value.
            </p>
            <p>
              Enterprise customers are increasingly viewing Microsoft as their primary AI partner, supporting the
              long-term investment thesis and justifying the increased allocation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alphabet Inc. (GOOGL) - 16% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Google's 17.3% return reflected strong advertising recovery and impressive progress with Gemini AI models.
              Search market share remained stable despite increased AI competition.
            </p>
            <p>
              The company's massive investment in AI infrastructure and talent is beginning to show returns, with Gemini
              gaining traction in both consumer and enterprise markets.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NVIDIA Corporation (NVDA) - 13% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              NVIDIA's 19.2% quarterly gain continued its exceptional run, driven by sustained demand for AI chips and
              new product launches. The company's Blackwell architecture received strong early customer interest.
            </p>
            <p>
              While valuation concerns persist, NVIDIA's technological leadership and expanding total addressable market
              support maintaining the position at current levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tesla Inc. (TSLA) - 9% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Tesla's slight decline of 0.9% reflected ongoing concerns about EV market competition and autonomous
              driving timeline. However, the company's energy business showed strong growth, and Supercharger network
              expansion continued.
            </p>
            <p>
              The position remains at a reduced weight while monitoring progress on Full Self-Driving capabilities and
              new model launches.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amazon.com Inc. (AMZN) - 9% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Amazon's impressive 23.8% return was driven by strong AWS growth and continued margin expansion in the
              retail business. The company's AI services gained significant enterprise traction.
            </p>
            <p>
              AWS remains a key competitive advantage, while the retail business benefits from improved operational
              efficiency and Prime membership growth.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Platforms (META) - 8% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Meta's 10.0% gain reflected steady advertising growth and progress on AI initiatives. The company's
              Reality Labs division showed signs of stabilization, though losses continued.
            </p>
            <p>
              The focus on efficiency and core business profitability continues to drive shareholder value, while
              metaverse investments are being managed more carefully.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Netflix Inc. (NFLX) - 5% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Netflix declined 21.4% during the quarter due to increased competition and concerns about subscriber
              growth saturation. The position was reduced to 5% allocation to free up capital for higher-conviction
              opportunities.
            </p>
            <p>
              While the company remains a leader in streaming, the competitive landscape has intensified, and growth
              prospects appear more limited compared to other portfolio holdings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist and Future Considerations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Netflix position reduction has created capital for potential new investments. Current watchlist
              includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Palantir Technologies (PLTR)</strong> - Strong government contracts and enterprise AI adoption
              </li>
              <li>
                <strong>Advanced Micro Devices (AMD)</strong> - Competitive AI chip offerings gaining market share
              </li>
              <li>
                <strong>ServiceNow (NOW)</strong> - Enterprise software leader with AI integration opportunities
              </li>
              <li>
                <strong>Snowflake (SNOW)</strong> - Data cloud platform benefiting from AI data requirements
              </li>
            </ul>
            <p>
              These companies offer exposure to high-growth AI and enterprise software markets while maintaining quality
              standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Thoughts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Q1 2025 demonstrated the portfolio's resilience and ability to generate alpha through quality stock
              selection. The technology focus continues to benefit from AI adoption trends, though increased selectivity
              is warranted given elevated valuations.
            </p>
            <p>
              The reduction in Netflix allocation reflects the dynamic nature of portfolio management and willingness to
              reallocate capital to higher-conviction opportunities. This disciplined approach should serve the
              portfolio well as market conditions evolve.
            </p>
            <p>
              Looking ahead to Q2, the focus remains on companies with strong competitive positions, pricing power, and
              exposure to secular growth trends. Market volatility may provide opportunities to add new positions or
              increase allocations to existing holdings at attractive valuations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
