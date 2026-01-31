"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { CompanyLogo } from "@/components/company-logo"
import { PortfolioChart } from "@/components/portfolio-chart"
import { PortfolioHorizontalBarChart } from "@/components/portfolio-horizontal-bar-chart"
import { useEffect, useState } from "react"
import { formatCurrency, formatPercentage } from "@/lib/financial-calculations"
import { calculateCAGRFromTotalReturn, calculateTimeWeightedReturn } from "@/lib/financial-calculations"
import { getYearsSinceInception } from "@/lib/constants"

// Manual data removed in favor of API fetching based on customDate



export default function Review2025Page() {
    const { isAnonymized } = useAnonymization()
    const [portfolioStats, setPortfolioStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const yearStats = [
        { label: "Portfolio Return", value: "+7.56% vs S&P", icon: TrendingUp, positive: true },
        { label: "Outperformance", value: "+7.56%", icon: TrendingUp, positive: true },
    ]

    useEffect(() => {
        const fetchPortfolioHistory = async () => {
            try {
                const response = await fetch('/api/portfolio-history')
                if (response.ok) {
                    const data = await response.json()

                    if (data.history && data.history.length > 0) {
                        const latestHistory = data.history[data.history.length - 1]
                        const formattedValue = formatCurrency(latestHistory.portfolioValue)

                        const yearsSinceInception = getYearsSinceInception()
                        const portfolioTWR = calculateTimeWeightedReturn(data.history)
                        const portfolioCAGR = calculateCAGRFromTotalReturn(portfolioTWR, yearsSinceInception)

                        const sp500History = data.history.map((h: any) => ({
                            date: h.date,
                            portfolioValue: h.sp500Value,
                            costBasis: h.costBasis
                        }))
                        const sp500TWR = calculateTimeWeightedReturn(sp500History)
                        const sp500CAGR = calculateCAGRFromTotalReturn(sp500TWR, yearsSinceInception)

                        setPortfolioStats([
                            {
                                title: "Portfolio Value (NZD)",
                                value: isAnonymized ? "NZ$***" : formattedValue,
                                subtitle: "Current portfolio value",
                                icon: TrendingUp,
                            },
                            {
                                title: "Portfolio Yearly CAGR",
                                value: formatPercentage(portfolioCAGR),
                                description: "Total Value Returns since inception",
                                icon: TrendingUp,
                            },
                            {
                                title: "S&P 500 Yearly CAGR",
                                value: formatPercentage(sp500CAGR),
                                description: "S&P 500 Total Value Returns since inception",
                                icon: TrendingUp,
                            },
                        ])
                    }
                }
            } catch (error) {
                console.error("Failed to fetch portfolio data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPortfolioHistory()
    }, [isAnonymized])


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Review: 2025</h1>
                    <p className="text-gray-600">Summary of 2025 performance and activities.</p>
                </div>

                {/* Year Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {yearStats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label} className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.positive ? "text-emerald-600" : "text-red-600"}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${stat.positive ? "text-emerald-600" : "text-red-600"}`}>
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="space-y-8">
                    {/* Introduction */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Portfolio Review: 2025</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none">
                                <p>2025 was the second complete calendar year for my portfolio. This is a summary of the performance and activities of my portfolio. I also review some of the rationale behind my investments for maximum transparency.</p>
                                <h3 className="font-bold text-lg mt-4 mb-2">Goal:</h3>
                                <p>Avoid permanent capital loss and achieve a +5% return on the index for the next 40+ years. The primary comparison point will be the S&P 500. I will be comparing them on a time-weighted return. I again added roughly $20000 NZD this year into the portfolio and plan to maintain at least this level of contribution next year. This represents most of my savings and Net Worth.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evolution of Investing Philosophy */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Evolution of my Investing philosophy: From Prediction to Adaptation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none">
                                <p>Late into this year, I began researching into power laws and ways to quantify advantages a company has. As a result, I came across Hamilton Helmers 7 powers frameworks and NZS capital theory on complexity investing. Combined with a recent read of Same as Ever by Morgan Housel. I have updated my investing philosophy to incorporate these factors. Maybe not to the exact extreme but a blended version with my existing philosophy. Below is my justification and reasoning.</p>
                                <p>Being a physicist by education my investment philosophy began with a Newtonian view of the world: we believe that if we gather enough data and apply enough intellect, we can predict the future path of a business like a planet in orbit. In this phase, we build concentrated portfolios of "compounding machines," confident that our analysis of their "wide moats" protects us.</p>
                                <p>However, as NZS Capital argue, markets are more like solar systems than we give credit to; they are like biological ecosystems, complex, adaptive, dominated by power laws and chaos. The illusion of precise prediction eventually shatters. I realized that generic "quality" is not enough; we need specific, structural barriers to arbitrage.</p>
                                <p>As a result, to drive better returns, we need blend Financial Discipline with Complexity Science:</p>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li><strong>Deeper Analysis (Statics):</strong> You still demand high-quality financial engines (Organic Growth, Operating Leverage), but you now layer on Power specific conditions that structurally prevent arbitrage and improve long term durability of assets.</li>
                                    <li><strong>Broader Opportunity (Dynamics):</strong> You acknowledge you cannot predict everything. Therefore, you construct a portfolio that is Resilient to shocks but has a long "tail" of Optionality—small bets that maximize your surface area for luck. Key point: We want to maximise the probability that we get lucky.</li>
                                </ol>
                                <p>The investing philosophy is to own high-quality businesses that balance Resilience (Safety) and Optionality (Upside). We seek companies that can adapt to a complex world, creating value for all stakeholders, while possessing structural advantages that protect their cash flows.</p>
                                <p>To be considered for the portfolio, a company must demonstrate strength across three pillars: Strategic Power, Financial Discipline, and Complexity Characteristics.</p>

                                <h4 className="font-bold mt-4">1. Strategic Power (The "Moat")</h4>
                                <p>Instead of a generic "wide moat," we now demand the presence of at least one of Hamilton Helmer’s 7 Powers. These specific conditions create a barrier to competition and enable persistent differential margins:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><strong>Scale Economies:</strong> Declining unit costs as volume increases (e.g., Netflix), creating a barrier where competitors cannot match unit economics.</li>
                                    <li><strong>Network Economies:</strong> Value to the customer increases as the installed base grows (e.g., LinkedIn), making it mathematically impossible for challengers to offer equivalent value.</li>
                                    <li><strong>Counter-Positioning:</strong> A new business model that incumbents cannot copy without damaging their existing business (e.g., Vanguard vs. active managers).</li>
                                    <li><strong>Switching Costs:</strong> Embedding into a customer's business so deeply that leaving is prohibitively expensive or risky (e.g., SAP).</li>
                                    <li><strong>Branding:</strong> The durable attribution of higher value to an objectively identical offering, allowing for pricing power (e.g., Tiffany’s).</li>
                                    <li><strong>Cornered Resource:</strong> Preferential access to a coveted asset that independently enhances value (e.g., Pixar’s Brain Trust).</li>
                                    <li><strong>Process Power:</strong> Embedded complex processes that enable lower costs or superior products and are hard to replicate (e.g., Toyota Production System).</li>
                                </ul>

                                <h4 className="font-bold mt-4">2. Financial & Operational Discipline (The Engine)</h4>
                                <p>While Power protects the castle, the engine must be efficient. The business must exhibit at least 3 of  the following 4 financial characteristics:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><strong>Organic Growth:</strong> A long runway of growth driven by internal developments rather than significant acquisitions. We seek a large Total Addressable Market (TAM) that can be expanded through innovation.</li>
                                    <li><strong>Operating Leverage:</strong> The company should be able to increase revenue faster than costs. As the business scales, margins should expand, creating a compounding effect on earnings.</li>
                                    <li><strong>Capital Light:</strong> The business should not require substantial capital expenditures (Capex) or excessive R&D merely to maintain its position. Growth should be capital-efficient, allowing for higher returns on invested capital.</li>
                                    <li><strong>Predictability:</strong> A consistent stream of cash flows over the long term, providing the resilience needed to survive market volatility.</li>
                                </ul>

                                <h4 className="font-bold mt-4">3. Complexity Characteristics (Adaptability)</h4>
                                <p>Beyond financials and power, companies must exhibit qualities that allow them to survive in uncertainty:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><strong>Non-Zero Sum (NZS):</strong> The company creates more value for its customers, employees, and society than it extracts for itself. This "win-win" dynamic creates a negative feedback loop that prevents regulation and disruption.</li>
                                    <li><strong>S-Curve Duration:</strong> Rather than seeking hyper-growth (which is fragile), we seek long-duration growth. We prefer companies that can "stack" new S-curves (new products/markets) on top of old ones to extend their lifecycle.</li>
                                    <li><strong>Adaptability:</strong> Management acts as capital allocators, not just operators. They focus on what won't change over 10 years while remaining decentralized enough to adapt quickly to what does change.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Portfolio Construction */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Portfolio Construction: The Barbell Strategy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none">
                                <p>To maximize the probability of "getting lucky" while preventing ruin, we move beyond a rigid 8-12 stock limit. Instead, we utilize a Barbell Strategy that balances Resilience and Optionality. We will be attempting a slightly more concentrated approach than NZS capital as there is only one portfolio manager and analyst. Thus, it is difficult to keep track of so many companies. We will not follow the numbers given below exactly as positions increase and decrease. But these are principles to guide our decision making.</p>
                                <ul className="list-disc pl-5 space-y-2 mt-4">
                                    <li><strong>The Head (Resilience + Optionality):</strong> High concentration (~10 companies, ~70%+ of assets, maximum 20% allocation, minimum 5%).
                                        <ul className="list-[circle] pl-5 mt-2">
                                            <li>These are high-conviction companies that meet the Strategic Power and Financial Discipline criteria (Operating Leverage, Organic Growth, etc.).</li>
                                            <li>They are "Compounding Machines" that act as the portfolio's anchor.</li>
                                            <li>A position size of greater than 12% is reserved for the companies with resilience and optionality that the market is discounting either or both. For example, Google in early 2024. These are the big bets that NZS capital won’t make but we can.</li>
                                        </ul>
                                    </li>
                                    <li><strong>The Tail (Pure Optionality):</strong> High diversification (many small positions 20-30, &lt;2% each).
                                        <ul className="list-[circle] pl-5 mt-2">
                                            <li>These are earlier-stage companies or "moonshots" with high potential upside but lower certainty or quality compounders with stretched valuations</li>
                                            <li>We do not attempt to predict which one will win; we buy a "basket" to expose the portfolio to positive "Black Swans" and maximize luck.</li>
                                        </ul>
                                    </li>
                                    <li><strong>Avoid the Middle:</strong> We aggressively avoid "value traps" or average companies that are neither highly resilient nor highly optional. Moreso, avoid holding companies for too long (&gt;1 year) for allocations between 2 and 5%. This creates unnecessary risk on the portfolio by having positions that are too overweight while not having resilience. However, there will be exceptions as optionality companies gain resilience.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emotional Intelligence */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Emotional Intelligence & Mindfulness</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none">
                                <p>Investing successfully requires good control of emotions and temperament.</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Mindfulness:</strong> Do not speculate or invest due to FOMO. Exercise discipline by adhering to the criteria above.</li>
                                    <li><strong>Buy Criteria:</strong> Buy compounding machines (Resilience) trading below intrinsic value with a margin of safety or buy Optionality when the potential payoff is asymmetric. Never sacrifice quality for valuation.</li>
                                    <li><strong>Sell Criteria:</strong> Sell when I make a mistake on the original analysis, cut losses and move on. Sell when a company loses its Power or Adaptability, or when it begins to extract too much value (Zero Sum) from its ecosystem. Do not become attached to mistakes.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Portfolio Overview */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Portfolio Overview and Key Developments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none space-y-6">
                                <div>
                                    <h3 className="font-bold text-xl mb-4">Portfolio Growth and Allocation</h3>
                                    <p>At the beginning of the year, my portfolio consisted of eleven companies. By year-end, I had expanded to twelve holdings. This number is expected to rise significantly in early 2026 as I implement a new investment philosophy focused on diversification and optionality. Below is a summary of my portfolio allocation at the start versus the end of the year.</p>
                                </div>

                                {/* Start of Year Chart */}
                                <div>
                                    <PortfolioHorizontalBarChart
                                        customDate="2025-01-01"
                                        hideControls={true}
                                    />
                                </div>

                                {/* End of Year Chart */}
                                <div>
                                    <PortfolioHorizontalBarChart
                                        customDate="2025-12-31"
                                        hideControls={true}
                                    />
                                </div>

                                <div>
                                    <h3 className="font-bold text-xl mb-4">Investment Focus and Market Selection</h3>
                                    <p>Throughout the year, all new capital was primarily invested on the NYSE and NASDAQ. The United States remains the most robust capital market, offering a broad moat and hosting many of the world’s most influential businesses. The abundance of available capital and the types of businesses I seek are all listed on these exchanges, whether natively or via ADRs. While these companies are U.S.-listed, their revenues and profits are globally diversified. However, this landscape may shift due to the current administration’s isolationist policies.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-xl mb-4">Performance and Key Contributors</h3>
                                    <p>This year, the portfolio delivered excellent results, outperforming the S&P 500 by 7.56%. The majority of gains were driven by three positions: <CompanyLogo symbol="GOOGL" name="Google" /> Google, <CompanyLogo symbol="ASML" name="ASML" /> ASML, and <CompanyLogo symbol="META" name="Meta" /> Meta. After the April tariff scare, performance aligned with the index but ultimately finished stronger. Google was the standout performer, benefiting from resilience and optionality as market concerns faded. Typically, a few positions drive annual performance, and increasing the number of holdings enhances the odds of capturing these standout results.</p>
                                </div>

                                {/* Performance Chart with locked 2025 range */}
                                <div className="my-8">
                                    <PortfolioChart
                                        portfolioStats={portfolioStats}
                                        initialPeriod="CUSTOM"
                                        initialStartDate={new Date("2025-01-01")}
                                        initialEndDate={new Date("2025-12-31")}
                                        locked={true}
                                    />
                                </div>

                                <div>
                                    <h3 className="font-bold text-xl mb-4">Reflection and Evolving Approach</h3>
                                    <p>Last year, I attributed much of the returns to favorable timing. While I still believe this played a significant role, I am growing more confident in my ability to analyze companies and their underlying businesses.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-xl mb-4">Currency Exposure and Asset Shifts</h3>
                                    <p>A significant change in my strategy this year involved reducing exposure to NZD-denominated assets. Given my KiwiSaver, savings, and primary income stream are already in NZD, it makes sense to avoid holding additional NZD assets. By investing in USD assets with diversified incomes, I am unintentionally reducing currency risk, despite the portfolio’s value being influenced by USD/NZD fluctuations. Over the long term, this impact should be minimal. Consequently, I sold out of Mainfreight and reallocated those funds to the U.S. market. While I remain open to optional positions in other markets, they are unlikely to become core holdings.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strategy & Company Updates */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Portfolio Management Strategy and Company Updates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none space-y-6">
                                <p>Going forward, my approach to discussing companies will shift from detailed individual analysis to focusing on any changes to thesis and portfolio management strategy.</p>

                                <div>
                                    <h4 className="font-bold text-lg">Recent Additions and Rationale</h4>
                                    <p>In the last quarter, the market performed well, though some companies experienced sell-offs due to external factors. Notably, <CompanyLogo symbol="UBER" name="Uber" /> Uber, <CompanyLogo symbol="AMZN" name="Amazon" /> Amazon, <CompanyLogo symbol="MA" name="Mastercard" /> MasterCard, and <CompanyLogo symbol="NFLX" name="Netflix" /> Netflix were significant additions. Each faced unique challenges that exerted downward pressure on stock prices, yet the long-term investment thesis remains intact.</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        <li><strong>MasterCard:</strong> Concerns about competition from stablecoins and fintechs like UPI in India threatened its network effect. However, MasterCard’s scale allows for integration with new platforms, and their expansion into data analytics and value-added services offers high-margin growth. These factors made temporary stock price weakness a buying opportunity for long-term returns.</li>
                                        <li><strong>Netflix:</strong> Announced the all-cash acquisition of HBO Max and Warner Studios, introducing execution risk but also access to a vast content library and new market opportunities. Despite the debt involved, Netflix’s strong cash flow and growing business support the acquisition’s potential. Even if the deal falls through, the loss is limited to a breakup fee. At current prices, Netflix offers significant return potential, with the acquisition increasing its optionality and resilience.</li>
                                    </ul>
                                    <p className="mt-2">Additional smaller positions were added in <CompanyLogo symbol="SE" name="Sea Limited" /> SE, <CompanyLogo symbol="MELI" name="MercadoLibre" /> MELI, and <CompanyLogo symbol="ZETA" name="Zeta Global" /> Zeta to complete those holdings.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg">New Positions: Duolingo and Adobe</h4>
                                    <p>During the quarter, I initiated positions in <CompanyLogo symbol="DUOL" name="Duolingo" /> Duolingo and <CompanyLogo symbol="ADBE" name="Adobe" /> Adobe. Duolingo, despite a market sell-off, retains solid fundamentals, has reached scale and profitability, and is emerging as a leader in edtech. The learning market is vast, and Duolingo’s resilience is underestimated. Monetization is just beginning, and growth remains the focus, making it a ~2% optionality position, the maximum size for such holdings.</p>
                                    <p>Adobe, on the other hand, faces concerns about AI replacing its products. I believe these fears are misplaced, as Adobe’s products remain sticky and the company is rapidly integrating AI workflows. The position may be oversized and will likely be reduced to below 2% of the portfolio as software companies are rerated and AI concerns diminish. Both Duolingo and Adobe represent optionality positions with upside potential, though I remain cautious of overconfidence. Additional smaller positions will be added in the next quarter to further reduce portfolio risk.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg">Portfolio Rebalancing</h4>
                                    <p>To fund these additions, I trimmed positions in <CompanyLogo symbol="ASML" name="ASML" /> ASML and <CompanyLogo symbol="GOOGL" name="Google" /> Google as their optionality decreased with rising valuations. The goal is to maintain these as sub-10% positions, with plans to sell approximately half over the next quarter. Both companies have nearly doubled, and while their fundamentals remain strong, current market valuations are more fully recognized. Continued strong performance supports holding these positions for potential further outperformance.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conclusion */}
                    <Card className="border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Conclusion and 2026</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose text-gray-700 max-w-none">
                                <p>This letter is about the right length for my quarterly review. Next quarter, I plan to expand the portfolio with new optionality positions and fresh capital, only adding to existing positions if exceptionally compelling. SaaS companies are a key focus, they've declined due to AI concerns, but I believe these fears are overstated and many are attractively priced. While some will be disrupted by AI, others stand to benefit greatly, making careful selection vital. Overall, I come to the realisation that portfolio management is more important than picking individual stocks; nearly any company can fit at the right allocation.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
