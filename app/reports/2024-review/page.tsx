import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function Report2024Review() {
  const portfolioHoldings = [
    { symbol: "AAPL", name: "Apple Inc.", allocation: "22%", value: "$27,595", return: "+28.4%" },
    { symbol: "MSFT", name: "Microsoft Corp.", allocation: "18%", value: "$22,577", return: "+15.2%" },
    { symbol: "GOOGL", name: "Alphabet Inc.", allocation: "15%", value: "$18,815", return: "+31.7%" },
    { symbol: "NVDA", name: "NVIDIA Corp.", allocation: "12%", value: "$15,052", return: "+239.1%" },
    { symbol: "TSLA", name: "Tesla Inc.", allocation: "10%", value: "$12,543", return: "-22.3%" },
    { symbol: "AMZN", name: "Amazon.com Inc.", allocation: "8%", value: "$10,034", return: "+56.8%" },
    { symbol: "META", name: "Meta Platforms", allocation: "8%", value: "$10,034", return: "+194.2%" },
    { symbol: "NFLX", name: "Netflix Inc.", allocation: "7%", value: "$8,780", return: "+65.4%" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">2024 Annual Review</h1>
        <p className="text-gray-600">A comprehensive look at portfolio performance and key holdings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Starting Value:</span>
                <span className="font-medium">$98,250</span>
              </div>
              <div className="flex justify-between">
                <span>Ending Value:</span>
                <span className="font-medium">$125,430</span>
              </div>
              <div className="flex justify-between">
                <span>Total Return:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  +27.7%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>S&P 500 Return:</span>
                <span className="font-medium">+24.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Holdings:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span>Largest Position:</span>
                <span className="font-medium">AAPL (22%)</span>
              </div>
              <div className="flex justify-between">
                <span>Best Performer:</span>
                <span className="font-medium">NVDA (+239.1%)</span>
              </div>
              <div className="flex justify-between">
                <span>Sector Focus:</span>
                <span className="font-medium">Technology</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Portfolio Holdings at Year End</CardTitle>
          <CardDescription>Complete breakdown of positions as of December 31, 2024</CardDescription>
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
              2024 proved to be an exceptional year for the portfolio, delivering a total return of 27.7% and
              outperforming the S&P 500 by 3.5 percentage points. The portfolio's technology-heavy allocation benefited
              significantly from the AI revolution and continued digital transformation trends.
            </p>
            <p>
              The portfolio maintained a concentrated approach with 8 core holdings, allowing for deeper research and
              conviction-based investing. This strategy paid off particularly well with positions in NVIDIA and Meta,
              which delivered outsized returns as AI adoption accelerated.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apple Inc. (AAPL) - 22% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Apple remained the portfolio's largest holding, delivering solid returns of 28.4% despite facing headwinds
              in China and increased regulatory scrutiny. The company's services business continued to grow, and the
              introduction of Apple Intelligence features positioned it well for the AI era.
            </p>
            <p>
              The Vision Pro launch, while not immediately transformative, demonstrated Apple's commitment to
              next-generation computing platforms. Strong iPhone 15 sales and robust services growth supported the
              investment thesis.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Microsoft Corporation (MSFT) - 18% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Microsoft's 15.2% return reflected its strong position in cloud computing and AI integration across its
              product suite. Azure continued to gain market share, while Copilot integration across Office 365
              demonstrated the company's AI leadership.
            </p>
            <p>
              The company's partnership with OpenAI and aggressive AI investments positioned it as a key beneficiary of
              the AI transformation, though competition intensified throughout the year.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alphabet Inc. (GOOGL) - 15% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Google's 31.7% return was driven by strong advertising recovery and significant progress in AI with Gemini
              and Bard. The company's search dominance remained intact while cloud services showed accelerating growth.
            </p>
            <p>
              Regulatory challenges persisted, but the company's AI capabilities and massive data advantages continued
              to provide a strong competitive moat.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NVIDIA Corporation (NVDA) - 12% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              NVIDIA was the portfolio's standout performer with a remarkable 239.1% return, driven by unprecedented
              demand for AI chips. The company's H100 and A100 GPUs became essential infrastructure for AI development.
            </p>
            <p>
              Despite concerns about sustainability of growth and potential competition, NVIDIA's technological lead and
              first-mover advantage in AI hardware proved decisive.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tesla Inc. (TSLA) - 10% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Tesla was the portfolio's only negative performer, declining 22.3% amid increased EV competition and
              concerns about Elon Musk's focus on other ventures. Production challenges and margin pressure weighed on
              the stock.
            </p>
            <p>
              However, the company's Supercharger network adoption by other manufacturers and progress on Full
              Self-Driving technology maintained long-term optimism for the position.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amazon.com Inc. (AMZN) - 8% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Amazon's 56.8% return reflected the market's recognition of AWS's AI capabilities and the e-commerce
              business's margin expansion. The company's focus on efficiency and profitability paid dividends.
            </p>
            <p>
              AWS remained a key growth driver, while the retail business showed improved operational leverage and
              strong Prime membership growth.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Platforms (META) - 8% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Meta's exceptional 194.2% return was driven by the "Year of Efficiency" initiative and strong advertising
              recovery. The company's AI investments in content recommendation and ad targeting showed clear ROI.
            </p>
            <p>
              While metaverse investments continued, the market appreciated the company's disciplined approach to
              capital allocation and focus on core business profitability.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Netflix Inc. (NFLX) - 7% Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Netflix delivered solid returns of 65.4% as the ad-supported tier gained traction and password sharing
              crackdowns drove subscriber growth. Content investments in international markets showed strong returns.
            </p>
            <p>
              The company's pivot to live content and sports programming positioned it well for future growth, while
              maintaining its leadership in streaming entertainment.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist and Future Considerations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Several companies remain on the watchlist for potential addition to the portfolio:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Advanced Micro Devices (AMD)</strong> - Potential beneficiary of AI chip demand with competitive
                products
              </li>
              <li>
                <strong>Palantir Technologies (PLTR)</strong> - AI and data analytics leader with government and
                enterprise focus
              </li>
              <li>
                <strong>Shopify Inc. (SHOP)</strong> - E-commerce platform with strong SMB market position
              </li>
              <li>
                <strong>CrowdStrike Holdings (CRWD)</strong> - Cybersecurity leader in an increasingly important sector
              </li>
            </ul>
            <p>
              These companies offer exposure to high-growth areas while maintaining the portfolio's technology focus and
              quality standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Thoughts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              2024 was a transformative year that validated the portfolio's focus on quality technology companies with
              strong competitive positions. The AI revolution created significant value for shareholders of companies
              positioned to benefit from this technological shift.
            </p>
            <p>
              Looking ahead to 2025, the portfolio remains well-positioned with companies that have demonstrated pricing
              power, strong balance sheets, and leadership positions in their respective markets. While valuations have
              expanded, the underlying business quality and growth prospects support continued optimism.
            </p>
            <p>
              The concentrated approach will continue, with a focus on companies that can compound wealth over the long
              term while adapting to technological and market changes. Risk management remains paramount, with position
              sizing and diversification across different technology sub-sectors providing balance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
