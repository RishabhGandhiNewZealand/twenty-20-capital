import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Briefcase, AlertTriangle, Target, Plus, Minus } from "lucide-react"
import { getLogoUrl } from "@/lib/company-utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency, maskShares } from "@/lib/anonymization-utils"

export default function Q3Report2025Page() {
  const { isAnonymized } = useAnonymization()

  const quarterStats = [
    { label: "Q3 Return", value: "+10%", icon: TrendingUp },
    { label: "S&P 500 Return Unhedged", value: "+10%", icon: DollarSign },
    { label: "Portfolio Value", value: 47000, icon: Target, isCurrency: true }, // Placeholder, will be calculated later
    { label: "Portfolio Additions", value: 5000, icon: Plus, isCurrency: true },
  ]

  const rawHoldings = [
    {
      symbol: "MELI",
      name: "Mercado Libre",
      return: "N/A",
      shares: 0.5,
      usdValue: 1168,
      nzdValue: 1946,
      stockCurrency: "USD",
      tier: "B",
    },
    {
      symbol: "SE",
      name: "Sea Limited",
      return: "N/A",
      shares: 7,
      usdValue: 1253,
      nzdValue: 2088,
      stockCurrency: "USD",
      tier: "B",
    },
    {
      symbol: "ZETA",
      name: "Zeta Limited",
      return: "N/A",
      shares: 97,
      usdValue: 1627,
      nzdValue: 2712,
      stockCurrency: "USD",
      tier: "C",
    },
    {
      symbol: "UBER",
      name: "Uber Technologies",
      return: "N/A",
      shares: 41,
      usdValue: 4018,
      nzdValue: 6696,
      stockCurrency: "USD",
      tier: "A",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc",
      return: "N/A",
      shares: 19,
      usdValue: 4180,
      nzdValue: 6967,
      stockCurrency: "USD",
      tier: "S",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc",
      return: "N/A",
      shares: 18,
      usdValue: 4374,
      nzdValue: 7290,
      stockCurrency: "USD",
      tier: "S",
    },
    {
      symbol: "MFT",
      name: "Mainfreight Limited",
      return: "N/A",
      shares: 67,
      usdValue: 2470,
      nzdValue: 4000, // Placeholder, will calculate later
      stockCurrency: "NZD",
      tier: "A",
    },
    {
      symbol: "MA",
      name: "Mastercard Inc",
      return: "N/A",
      shares: 4,
      usdValue: 2272,
      nzdValue: 3786,
      stockCurrency: "USD",
      tier: "S",
    },
    {
      symbol: "NFLX",
      name: "Netflix Inc",
      return: "N/A",
      shares: 2,
      usdValue: 2398,
      nzdValue: 3993,
      stockCurrency: "USD",
      tier: "S",
    },
    {
      symbol: "SPGI",
      name: "S&P Global Inc",
      return: "N/A",
      shares: 5,
      usdValue: 2430,
      nzdValue: 4050,
      stockCurrency: "USD",
      tier: "S",
    },
    {
      symbol: "ASML",
      name: "ASML Holding N.V.",
      return: "N/A",
      shares: 4,
      usdValue: 3992, // Placeholder, will calculate later
      nzdValue: 6653, // Placeholder, will calculate later
      stockCurrency: "USD",
      tier: "S",
    },
  ]

  const totalUsdValue = rawHoldings.reduce((sum, holding) => sum + holding.usdValue, 0)
  
  const portfolioHoldings = rawHoldings.map(holding => ({
    ...holding,
    allocation: parseFloat(((holding.usdValue / totalUsdValue) * 100).toFixed(1))
  })).sort((a, b) => b.allocation - a.allocation)

  const totalValue = portfolioHoldings.reduce((sum, holding) => {
    return sum + holding.nzdValue
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q3 2025 Report</h1>
          <p className="text-gray-600">Portfolio Performance</p>
        </div>

        {/* Quarter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quarterStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.isCurrency ? maskCurrency(stat.value, isAnonymized, 'NZD') : stat.value}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Portfolio Holdings */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Portfolio Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chart and Table Side by Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Horizontal Bar Chart */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Allocation by Position</h4>
                <div className="flex-1 flex flex-col justify-center space-y-3 min-h-[400px]">
                  {portfolioHoldings.map((holding) => {
                    const maxAllocation = Math.max(...portfolioHoldings.map(h => h.allocation))
                    const barWidth = (holding.allocation / maxAllocation) * 100
                    
                    return (
                      <div key={holding.symbol} className="flex items-center">
                        <div className="w-20 flex items-center justify-start mr-3">
                          <img 
                            src={getLogoUrl(holding.symbol)} 
                            alt={`${holding.symbol} logo`}
                            className="w-5 h-5 rounded mr-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium text-gray-600">{holding.symbol}</span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-7 relative">
                          <div 
                            className={`h-7 rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white ${
                              holding.tier === 'S' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          >
                            {holding.allocation}%
                          </div>
                        </div>
                        <div className="w-20 text-xs text-gray-600 ml-3">
                          <span className={`px-1 py-0.5 rounded text-white text-xs ${
                            holding.tier === 'S' ? 'bg-blue-600' : 'bg-green-600'
                          }`}>
                            {holding.tier}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Portfolio Details</h4>
                <div className="flex-1 overflow-x-auto min-h-[400px]">
                  <table className="w-full h-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Symbol</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Company</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-700">Allocation</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-700">Shares</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-700">Value (NZD)</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioHoldings.map((holding, index) => (
                        <tr key={holding.symbol} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="py-3 px-2">
                            <span className="font-bold text-gray-900">{holding.symbol}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-gray-700 text-sm">{holding.name}</span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="font-medium text-gray-900">{holding.allocation}%</span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="text-gray-700">{maskShares(holding.shares, isAnonymized)}</span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="font-medium text-gray-900">
                              {maskCurrency(holding.nzdValue, isAnonymized, 'NZD')}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                              holding.tier === 'S' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {holding.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Main Report Content */}
        <div className="space-y-8">
          {/* Portfolio Activities: 2025 Q3 */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Activities: 2025 Q3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  <strong>Goal:</strong> Avoid permanent capital loss and achieve a +5% return on the index for the next 40+ years. The primary comparison point will be the S&P 500 on an unhedged basis. I will be comparing them on a money-weighted return basis, this will account for inflows of capital into the portfolio. I added roughly {maskCurrency(5000, isAnonymized, 'NZD')} this quarter into the portfolio and plan to maintain or exceed this level of contribution next quarter.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Investing Philosophy */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Investing Philosophy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  There have been no changes to my investing philosophy in terms of the types of companies I look for. Please see Investment Philosophy in 2024 Portfolio Review.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio construction */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio construction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  The overall approach to portfolio construction has largely stayed consistent this quarter. Building on the previous quarter’s efforts, I continued to focus on reducing risk correlation among my holdings. As part of this, I shifted the portfolio away from a heavy US tech emphasis, introducing greater exposure to newer sectors and international markets. While I recognise that this broader diversification may temper returns in the short term, it was necessary given that the portfolio was previously around 80% concentrated in US assets. Looking ahead, a long-term target of approximately 60% US exposure feels appropriate, though I’m not fixated on precise allocation percentages, as there’s no exact formula here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Performance */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  This quarter, the portfolio delivered solid results, posting a return of approximately 10%—closely tracking the performance of the index. The market demonstrated resilience, staging a strong rebound in the aftermath of tariff concerns. Despite persistent and escalating geopolitical uncertainty, investor sentiment remained largely undisturbed, contributing to rising valuations and profitability. Reflecting these conditions, I maintained an active approach: I increased my allocation to two existing positions, initiated three new ones, and fully exited another. Notably, several of these acquisitions were strategic moves to diversify beyond US tech and boost my exposure to international markets.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Commentary */}
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Additional Commentary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <div className="mt-6">
                  <p>
                    Tariffs appear to be fading as a concern and unlikely to cause major economic disruption beyond marginal inflation—which typically benefits asset prices long-term.
                  </p>
                  <p>
                    Two themes worth noting: First, geopolitical tensions in Israel/Gaza and Russia/Ukraine continue escalating despite ceasefire talks, with Russia testing NATO's boundaries and Israel doubling down on their approach. Without passing judgment, it's clear all parties are pushing closer to the brink.
                  </p>
                  <p>
                    Second, we're definitively in an AI bubble, though it likely has at least another year or more to run. The distinction is crucial: Google, Amazon, Microsoft, and Meta can absorb AI infrastructure spending into their existing businesses if ROI never materializes. OpenAI is different—signing massive deals ({maskCurrency(300000000000, isAnonymized, 'USD')} with Oracle) without substantial revenue, now making equity investments (like their AMD stake) rather than cash transactions. This mirrors 2000s bubble dynamics exactly.
                  </p>
                  <p>
                    These moves aren't irrational, but they're betting on OpenAI cracking ASI (artificial superintelligence) and monetizing it massively within years—with no fallback plan. Even in bubble conditions, investor tolerance for cash burn is finite.
                  </p>
                  <p>
                    AI adoption is proceeding slowly and will take longer than anticipated. It took a decade for truly transformative internet companies and products to emerge. My view: this time isn't different. OpenAI's equity-based and massive future revenue deals are propping up the bubble despite no current path to profitability, and eventually reality will catch up.
                  </p>
                  <p>(As I am writing this, another deal with Broadcom has been inked)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New positions */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                New Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('MELI')} 
                      alt="MELI logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Mercado Libre (MELI: NYSE) & Sea limited (SE: NYSE)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    These two new positions, Mercado Libre (MELI) and Sea Limited (SE), were purchased using the capital generated from the sale of my META holdings.
                  </p>
                  <p className="text-gray-700 mb-2">
                    They operate as leading e-commerce and financial technology (fintech) platforms in high-growth regions: MELI in South and Central America, and SE in Southeast Asia. Both companies offer integrated services, including a robust online shopping marketplace and a financial arm that provides sellers with access to capital and streamlined payment processing. SE also benefits from its distinct and successful Garena gaming division.
                  </p>
                  <p className="text-gray-700 mb-2">
                    The core motivation behind these purchases is to secure focused exposure to the rapidly expanding consumer bases in Latin America and Southeast Asia. Both organizations have established significant barriers to entry within their markets, creating durable competitive advantages. By actively supporting the economic development of their regions, they are well-positioned for sustained, rapid growth.
                  </p>
                  <p className="text-gray-700 mb-2">
                    The companies are benefiting from powerful trends, particularly the increasing adoption of the internet and the emerging application of AI in commerce. They are currently making substantial investments (Capex) to expand their essential logistics and infrastructure networks. I anticipate this growth trajectory will continue, projecting a 20% compound annual revenue growth rate for both companies over the next decade.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Additionally, this investment decision enhances the portfolio’s geographic diversity while maintaining high standards of quality. I believe the market currently underappreciates their value proposition. With attractive current valuations and strong growth prospects, these companies are set to become increasingly critical and entrenched players in their respective emerging markets.
                  </p>
                  <p className="text-gray-700 mb-2">
                    I will likely think of these companies as a single position, adding to whichever one is a better value and doing better for the time being. While trying to keep them roughly equal in weight around 4-8%. As my conviction grows, this may change. Over the last 5 years, their revenues have grown manyfold. while the share price has not followed due to high valuations in the past.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value (MELI):</strong> {maskCurrency(3000, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis (MELI):</strong> {maskCurrency(2475, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position (MELI):</strong> {maskShares(0.5, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025 (MELI):</strong> {maskCurrency(2336, isAnonymized, 'USD')}</p>
                    <p><strong>Intrinsic value (SE):</strong> {maskCurrency(250, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis (SE):</strong> {maskCurrency(194, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position (SE):</strong> {maskShares(7, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025 (SE):</strong> {maskCurrency(179, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('ZETA')} 
                      alt="ZETA logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Zeta Limited (ZETA: NYSE)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Zeta Limited (ZETA: NYSE) represents the high-risk allocation within my portfolio, designed to provide the potential for amplified gains. My strategy is to maintain one or two such positions—companies with the capability to generate outsized returns (even up to 10-100x)—while ensuring that quality is not completely sacrificed in pursuit of this potential. My primary focus is on smaller market cap companies, typically around {maskCurrency(1000000000, isAnonymized, 'USD')}, that are currently experiencing negative sentiment or have recently been impacted by adverse events. These types of positions are inherently volatile, often lacking strong moats, and could feasibly go to zero, so I intend to limit this segment to less than 10% of the overall portfolio. This approach is a slight deviation from my core investment thesis, given the elevated volatility, but the fundamental principles still apply I am searching for companies with the ability to compound over the long term and build enduring value.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Zeta Limited is the first company to fill this role. Zeta operates as an enterprise software provider, helping clients optimise their marketing and advertising strategies. The offering is straightforward in concept: by leveraging proprietary data, customer data, and machine learning algorithms, Zeta identifies optimal audiences for its clients’ products. The return on investment delivered to customers is compelling—by targeting more likely buyers, clients can achieve better results while reaching fewer people. Notably, Zeta’s data is considered among the top three or four globally (after Google and Meta), enabling effective targeting at lower costs and with greater flexibility.
                  </p>
                  <p className="text-gray-700 mb-2">
                    The company is currently growing revenue at over 30% annually, with the potential for further acceleration as clients increasingly recognise the value of the platform and expand their spending. This dynamic could create a powerful flywheel effect, with word-of-mouth driving new client acquisition. Zeta is approaching profitability as its software-as-a-service (SaaS) operating model allows revenue to scale much more quickly than costs, providing significant leverage.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Recently, a short report alleging questionable accounting practices and an associated lawsuit caused Zeta’s stock to decline sharply. However, management remains confident in the integrity of their accounting, noting that independent third-party audits have been conducted. I view these allegations as frivolous and expect them to be disproven in due course.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Currently, Zeta trades at approximately 4x price-to-sales, growing at 30%+ annually, and has the potential to achieve 30%+ operating margins within the next five to ten years. If the company sustains its current growth rate over the next five years, I believe there is a realistic path for the stock to increase tenfold from current levels. Artificial intelligence is a significant tailwind, simplifying customer onboarding and enabling even more effective, customised marketing solutions. The market appears to underestimate both the strength and stickiness of Zeta’s business model. Provided management’s claims about customer ROI hold true, the company’s future looks promising—despite the recent erosion of market confidence due to the short report and lawsuit.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(50, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(16.8, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(97, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025:</strong> {maskCurrency(16.78, isAnonymized, 'USD')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sells */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Minus className="h-5 w-5 mr-2 text-red-600" />
                Sells
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-red-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('META')} 
                      alt="META logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Meta (META: NASDAQ) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    I have sold my position in Meta, despite previously considering it a fantastic company. The decision was driven by two main factors. First, I wanted to reduce my exposure to US big tech and Meta was the holding in which I had the least conviction. Second, I have grown increasingly concerned that, although Meta will likely remain profitable for years to come, its overall impact on society is negative in my view. While products like WhatsApp and Messenger are undeniably useful, I believe Meta’s platforms have contributed to decreased real socialisation and heightened anxiety across the globe. The recent push into products such as smart glasses appears poised to further compound these issues.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Given these concerns, I exited my position in Meta for a solid profit. If the company’s direction meaningfully changes, I may consider re-entering in the future. Zuckerberg has positioned Meta as a leader in AI, and the company will likely remain at the forefront of this technology; however, if AI is leveraged to intensify the existing societal problems caused by Meta’s platforms, I believe the company will continue to be a net negative for society.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(750, isAnonymized, 'USD')}</p>
                    <p><strong>Price@30/09/2025:</strong> {maskCurrency(734, isAnonymized, 'USD')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incremental Buys */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Incremental Buys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('UBER')} 
                      alt="UBER logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">UBER (UBER: NYSE) (A tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Uber continues to perform well, executing effectively on its strategic initiatives. This quarter, revenue grew by 18%, accompanied by further gains in profitability. Notably, the Uber One loyalty program is delivering significant value to users and is proving to be a robust customer acquisition tool—membership is growing at 50% year-over-year, and there is a realistic path to {maskShares(100000000, isAnonymized)} subscribers over the next five years. In addition, Uber is steadily expanding its partnerships with a range of autonomous vehicle players, including WeRide, AvRide, Cruise, May Mobility, Nuro/Lucid, and Volkswagen, among others. The company’s strategy is to foster a fragmented AV market with multiple participants, positioning itself as the leading aggregator. While Waymo has rapidly scaled and represents the largest competitive threat to Uber’s U.S. business, Uber’s strong execution thus far gives me continued confidence. I remain bullish on Uber’s prospects and took advantage of minor share price dips to add slightly to my position. Although the stock has appreciated, I believe there remains substantial upside ahead.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(120, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(69, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(41, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025:</strong> {maskCurrency(98, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('AMZN')} 
                      alt="AMZN logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Amazon (AMZN: NASDAQ) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    My confidence in Amazon continues to grow, as the company maintains its leadership across various sectors and, in my view, remains undervalued by the market. Amazon Web Services (AWS) stands as the backbone of the internet, underscored by the recent outage—which, while likely causing a short-term financial impact, ultimately serves to highlight just how vital AWS is for investors. AWS’s momentum is picking up again, fuelled by strong AI-driven demand, and the company is increasingly winning business from smaller enterprises—a more impactful growth strategy, I believe, than simply pursuing large AI contracts as Microsoft has. The cloud backlog at AWS is now up over 20%, surpassing the {maskCurrency(200000000000, isAnonymized, 'USD')} mark. After sentiment dipped following Andy Jassy’s earnings call, I took advantage of the market’s reaction to add to my position. With AI adoption accelerating the need for cloud services, I expect AWS’s growth trajectory to strengthen further. This quarter, I had a key insight into AWS’s enduring advantage: once data is stored at scale in a particular cloud, it becomes effectively immovable between providers, locking in long-term demand for compute within that ecosystem. Given AWS’s unmatched data volume, it is best positioned to capture this enduring demand over the long haul.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(300, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(203, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(19, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025:</strong> {maskCurrency(220, isAnonymized, 'USD')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holds */}
          <Card className="border-yellow-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-yellow-600" />
                Holds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('GOOGL')} 
                      alt="GOOGL logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Google (GOOGL: NASDAQ) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Google continues to deliver in line with my expectations, executing at a high level throughout the quarter. The company is clearly capitalizing on its AI leadership, as it remains the only firm with the combined strength of world-class research, proprietary hardware (chips), unmatched infrastructure, and vast distribution capabilities. This unique combination has long been underestimated by the market, but sentiment is gradually shifting as Google’s competitive advantages become more apparent.
                  </p>
                  <p className="text-gray-700 mb-2">
                    This quarter, the favorable resolution of the DOJ case—allowing Google to retain ownership of Chrome—represents a significant win, further solidifying their entrenched market position. The company’s diverse business segments, including Cloud, Search, YouTube, and Waymo, all continue to perform strongly.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Importantly, Google recently announced a major quantum computing breakthrough. While the market has largely ignored this development, I believe Google’s leadership in quantum computing will become transformative over the next decade, adding yet another layer to its long-term growth story.
                  </p>
                  <p className="text-gray-700 mb-2">
                    My conviction in Google has only increased this quarter, mirroring the growing confidence of the broader market. Given the company’s deep moats and ongoing innovation, I view Google as one of the most compelling AI investments available.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(300, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(173, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(18, isAnonymized)} shares</p>
                    <p><strong>Price@30/09/2025:</strong> {maskCurrency(243, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('MFT')} 
                      alt="MFT logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Mainfreight (MFT: NZE) (A tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Mainfreight’s last quarter was uneventful, with shares down a little bit as New Zealand’s economy lagged. Despite this, the company continues to invest and expand its market share. I’ve held MFT for over two years with no gains, which has limited my portfolio’s growth, but I remain confident in its long-term prospects.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(90, isAnonymized, 'NZD')}-{maskCurrency(100, isAnonymized, 'NZD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(64.20, isAnonymized, 'NZD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(67, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> {maskCurrency(62.9, isAnonymized, 'NZD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('MA')} 
                      alt="MA logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Mastercard (MA: NYSE) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Mastercard delivered strong results, with revenues up 16% and net income rising 14%. Its competitive moat remains secure, and management drives innovation in stablecoin, security, and B2B payments, which offer significant growth potential. The company’s fees and exceptional security create real pricing power, especially for large transactions, yet Mastercard focuses on expanding volumes—a key advantage as B2B payments scale. Operating leverage improves with growth, and my confidence in Mastercard continues to rise. Despite a flat stock, 15% annual returns over the next decade seem achievable. The company’s story remains as robust as ever.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(600, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(449, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(4, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> {maskCurrency(568, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('NFLX')} 
                      alt="NFLX logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Netflix (NFLX: NASDAQ) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    There aren’t many new updates this month; the company continues to deliver on its main growth metrics. Organic growth remains strong, and the potential for expansion is still significant. Reaching {maskShares(500000000, isAnonymized)} subscribers by the end of 2030 appears attainable. Aside from telecommunications companies, no one else has that many paying subscribers. Recently, Netflix has demonstrated some pricing power, but there’s still room to grow. Within five years, Netflix could potentially charge {maskCurrency(50, isAnonymized, 'USD')} a month while still offering good value.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(1150, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(769, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(2, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> {maskCurrency(1199, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('SPGI')} 
                      alt="SPGI logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Standard and Poor Global (SPGI: NYSE) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    SPGI is separating its mobility division, but I don't think this move will have much impact. I'm planning to offload those shares right away and put the money into MSCI or add more SPGI. The stock has been trailing the tech companies since it's not seen as an AI-focused company, but I’m still confident in its long-term prospects. Eventually, I think companies like SPGI, which aren’t pure AI plays, could gain more from AI’s growth than the AI-first firms, especially as AI turns into more of a commodity.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(650, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(510, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(5, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> {maskCurrency(486, isAnonymized, 'USD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={getLogoUrl('ASML')} 
                      alt="ASML logo"
                      className="w-6 h-6 rounded mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h3 className="font-bold text-gray-900">Advanced Semiconductor Materials Lithography (ASML: NYSE) (S tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    ASML stock initially declined after unclear statements about 2026 growth despite solid revenue 15% and operating income growth, but market recognition of its machines' value and announcements of increased AI spend led to a rebound near all-time highs. Customers are investing in new fabs, and all AI funding is expected to benefit ASML. The company's technological edge should sustain its lead; significant threats like Chinese replication or paradigm shifts seem unlikely in the near term. I think the biggest challenge for ASML is securing and strengthening its supply chain.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> {maskCurrency(900, isAnonymized, 'USD')}-{maskCurrency(1000, isAnonymized, 'USD')}</p>
                    <p><strong>Cost Basis:</strong> {maskCurrency(713, isAnonymized, 'USD')}</p>
                    <p><strong>Final Position:</strong> {maskShares(4, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> {maskCurrency(998, isAnonymized, 'USD')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conclusion */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Conclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p>
                  Overall, this quarter had its share of excitement, with most positions performing to expectations or better. The portfolio’s moat is stronger than ever, setting the stage for continued growth. Next quarter, I’m hoping to add more than {maskCurrency(5000, isAnonymized, 'NZD')} and aiming for an {maskCurrency(8000, isAnonymized, 'NZD')} target. The outlook is bright, and the strategy is working—steady progress toward long-term goals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
