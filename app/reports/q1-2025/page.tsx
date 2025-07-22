import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Briefcase, AlertTriangle, Target, Plus, Minus } from "lucide-react"

export default function Q1Report2025Page() {
  const quarterStats = [
    { label: "Q1 Return", value: "-5.4%", icon: TrendingUp },
    { label: "Index Return", value: "-4.2%", icon: DollarSign },
    { label: "Portfolio Value", value: "~$36,000 NZD", icon: Target },
  ]

  // Portfolio Holdings - calculating proper allocations
  const rawHoldings = [
    { 
      symbol: "UBER", 
      name: "Uber Technologies",
      return: "+6.5%",
      shares: 40,
      usdValue: 2916, // $72.9 * 40 shares
      nzdValue: "$4,860",
      stockCurrency: "USD",
      tier: "A"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc",
      return: "-10.9%",
      shares: 15,
      usdValue: 2310, // $154 * 15 shares
      nzdValue: "$3,850",
      stockCurrency: "USD",
      tier: "A"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc",
      return: "-2.1%",
      shares: 13,
      usdValue: 2470, // $190 * 13 shares
      nzdValue: "$4,117",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms Inc",
      return: "+28.0%",
      shares: 3,
      usdValue: 1728, // $576 * 3 shares
      nzdValue: "$2,880",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "NFLX", 
      name: "Netflix Inc",
      return: "+21.1%",
      shares: 2,
      usdValue: 1864, // $932 * 2 shares
      nzdValue: "$3,107",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "MA", 
      name: "Mastercard Inc",
      return: "+22.0%",
      shares: 4,
      usdValue: 2192, // $548 * 4 shares
      nzdValue: "$3,653",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "ASML", 
      name: "ASML Holding N.V.",
      return: "-7.2%",
      shares: 4,
      usdValue: 2648, // $662 * 4 shares
      nzdValue: "$4,413",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "SPGI", 
      name: "S&P Global Inc",
      return: "-0.4%",
      shares: 5,
      usdValue: 2540, // $508 * 5 shares
      nzdValue: "$4,233",
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "MFT", 
      name: "Mainfreight Limited",
      return: "+11.9%",
      shares: 50,
      usdValue: 2205, // $73.50 NZD * 50 shares * 0.6 USD/NZD rate
      nzdValue: "$3,675",
      stockCurrency: "NZD",
      tier: "A"
    }
  ]

  // Calculate total USD value and allocations
  const totalUsdValue = rawHoldings.reduce((sum, holding) => sum + holding.usdValue, 0)
  
  const portfolioHoldings = rawHoldings.map(holding => ({
    ...holding,
    allocation: parseFloat(((holding.usdValue / totalUsdValue) * 100).toFixed(1))
  })).sort((a, b) => b.allocation - a.allocation)

  const totalValue = portfolioHoldings.reduce((sum, holding) => {
    return sum + parseFloat(holding.nzdValue.replace(/[$,]/g, ''))
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q1 2025 Report</h1>
          <p className="text-gray-600">Portfolio Performance</p>
        </div>

        {/* Quarter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quarterStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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
                        <div className="w-16 text-xs font-medium text-gray-600 text-right mr-3">
                          {holding.symbol}
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
                            {holding.tier} tier
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
                            <span className="text-gray-700">{holding.shares}</span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="font-medium text-gray-900">
                              {holding.nzdValue}
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

            {/* Portfolio Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Positions:</span>
                  <div className="font-bold text-gray-900">{portfolioHoldings.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">S Tier Holdings:</span>
                  <div className="font-bold text-blue-600">{portfolioHoldings.filter(h => h.tier === 'S').length}</div>
                </div>
                <div>
                  <span className="text-gray-600">A Tier Holdings:</span>
                  <div className="font-bold text-green-600">{portfolioHoldings.filter(h => h.tier === 'A').length}</div>
                </div>
                                 <div>
                   <span className="text-gray-600">Portfolio Value:</span>
                   <div className="font-bold text-gray-900">${totalValue.toLocaleString()} NZD</div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Report Content */}
        <div className="space-y-8">
          {/* Portfolio Performance Overview */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  Overall, the portfolio has performed in line with the index. The quarter started off well, resulting in roughly 8% gains for the portfolio but in recent weeks, we have fallen to a 5.4% loss. The index is currently at a 4.2% loss. We are underperforming the index this quarter. However, this is to be expected, my portfolio is inherently higher risk, as I try to get a higher than market return. Thus, in a downturn I expect the portfolio to fall more than the broader market. As the market has fallen. I have continued adding to my positions and starting one new position. I also trimmed one position. I was also exited out of 3 positions, one of which is a mistake. Let's get into it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trims and Sells */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Minus className="h-5 w-5 mr-2 text-red-600" />
                Trims and Sells
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-red-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Canadian Pacific Kansas City Railways (CP: NYSE) (A tier)</h3>
                  <p className="text-gray-700 mb-2">
                    This quarter I exited Canadian pacific in early February after the Trump Canadian and Mexican tariffs got announced. Truth be told I was scared out of this position by macro-economic factors. There was no change to the fundamentals and the company will likely continue to do well into the foreseeable future. While the demand for their services may decrease the long-term growth prospects are largely unchanged as I came to understand that the tariffs will not be a factor long term.
                  </p>
                  <p className="text-gray-700 mb-2">
                    I reacted too quickly after 'bad' news and sold on fear rather than reason here. And I need to do better in this regard. This lesson is now learnt, and I will react appropriately to news in the future, in many cases not reacting at all.
                  </p>
                  <p className="text-gray-700">
                    Luckily for me, the price of CP stock has remained largely unchanged since I sold. Offering me an opportunity to re-enter the position in the future. It is a business that I wish to own for the long term, despite not offering super high growth, it should provide stable returns from its current price point.
                  </p>
                </div>

                <div className="border-l-4 border-red-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Morgan Stanley Capital (MSCI: NYSE) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    I also exited out of MSCI for two reasons, Firstly I believe the company is very similar to S&P global, albeit with slightly faster growth but less diversified in its product offerings. This poses slightly higher risk. Secondly, after SPGI's recent merger and the debt renewal wall coming up, I believe that SPGI has significantly greater potential for outperformance. And the market is not appropriately pricing this growth. The funds from the sale were directly transferred into SPGI to consolidate my financial data provider's position. Only time will tell if this was the correct move or not.
                  </p>
                  <p className="text-gray-700">
                    One risk to this play is that MSCI beats expectations better than SPGI and the market rates the company back to 50+ PE multiples. But betting on the market re rating companies is a not a reasonable strategy. If MSCI trades down over the course of the year, I will happily add to it.
                  </p>
                </div>

                <div className="border-l-4 border-red-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Salesforce (CRM: NYSE) (A tier)</h3>
                  <p className="text-gray-700 mb-2">
                    I sold out of my shares of Salesforce in mid to late March, for one main reason. I needed the cash for better opportunities. Amazon and Google both sold off significantly. I think they are much higher quality business than Salesforce. So, I traded up the quality of my portfolio to those businesses. At current prices, AMZN especially is a great deal which has sold off with the broader market. So I may look to trim/exit out of my entire position over the next quarter. I think Salesforce is an excellent company with great customer lock in. And it will continue to grow for the next decade.
                  </p>
                  <p className="text-gray-700">
                    The question I am trying to answer is, will it be faster than AMZN, at current prices? I think not.
                  </p>
                </div>

                <div className="border-l-4 border-red-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Arista Network (ANET: NYSE) (A Tier)</h3>
                  <p className="text-gray-700 mb-2">
                    This report wouldn't be complete without mentioning my second blunder this quarter. I started a small position in Arista before closing it the next day for a small 2% loss. I started a position in Arista because I thought it was undervalued after the Deep Seek selloff. But I found myself asking questions about their business that I did not know the answer to. This gave me great uncertainty in the holding and made me uncomfortable holding it because I did not know enough about their business. So when prices dropped or increased, it was not easy to decide to buy more or to sell. Thus I decided to sell until I better understand the business. Overall, I do think the business is solid, but I would need a larger margin of safety before entering due to high risk.
                  </p>
                  <p className="text-gray-700">
                    The lesson here is to not enter a position because it has dropped 15% unless you understand the company well.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Positions */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                New Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-l-4 border-green-200 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Advanced Semiconductor Materials Lithography (ASML: NYSE) (S tier)</h3>
                <div className="text-gray-700 space-y-3">
                  <p>
                    ASML sits at the absolute pinnacle of technological achievement. Their EUV lithography machines are fundamental to producing the most advanced semiconductors – the brains powering AI, cloud computing, and more. Key players like TSMC and Samsung depend entirely on ASML for their cutting-edge fabs, enabling companies like Nvidia. Frankly, these machines are engineering marvels operating at the cutting edge of physics, arguably more complex than the James Webb telescope. This makes ASML indispensable; without them, the high-end chip production needed for ongoing technological advancement simply wouldn't happen.
                  </p>
                  <p>
                    The company enjoys a near-monopoly (>90% share) in high-end lithography, protected by a moat requiring decades and tens of billions for any competitor to cross. This dominance grants significant pricing power, with EUV machines fetching over $300 million each, further boosted by complexity limiting annual production. While the stock pulled back over 30% from highs on concerns around China sales (due to regulations) and potential competition, I believe these fears are overblown. Demand from other regions should compensate, and there's no credible evidence anyone is close to replicating their core tech, leaving their competitive advantage firmly intact.
                  </p>
                  <p>
                    Looking forward, the growth path seems clear. ASML's technology, guided by the Rayleigh criterion, has a significant runway for miniaturization via optics and computational processing advancements, suggesting a strong innovation pipeline for potentially two decades. Furthermore, their machines operate for decades, providing stable, service-based maintenance revenue. Coupled with relentless global semiconductor demand driven by secular trends (AI, auto, cloud), ASML is perfectly positioned as a critical enabler.
                  </p>
                  <p>
                    Therefore, I initiated a position in ASML early January and added throughout the quarter, seeing it as significantly undervalued. I plan to hold this long-term, with the primary catalyst for selling being the unlikely emergence of a competitor with an equally capable machine. Importantly, ASML also adds valuable diversification as a non-US company, reducing geographic concentration and introducing a different risk profile compared to my other holdings.
                  </p>
                                     <div className="mt-4 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $900-1000 USD</p>
                     <p><strong>Cost Basis:</strong> $713 USD</p>
                     <p><strong>Final Position:</strong> 4 shares</p>
                     <p><strong>Price@31/3/2025:</strong> $662 USD</p>
                     <p><strong>Portfolio Value:</strong> $4,413 NZD</p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buys */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Buys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Standard and Poor Global (SPGI: NYSE) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    S and P Global continued along its merry way this quarter, with business as usual. The story remained as is and the company's performance was within expectations. I continued to add to it during this quarter, with new capital and consolidated my MSCI position into SPGI for reasons mentioned above. This slightly reduced my cost basis. The position is now a full-size position. And I still expect to hold it for years to come.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $620-670 USD</p>
                     <p><strong>Cost Basis:</strong> $510 USD</p>
                     <p><strong>Final Position:</strong> 5 shares</p>
                     <p><strong>Price@31/3/2025:</strong> $508 USD</p>
                     <p><strong>Portfolio Value:</strong> $4,233 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Amazon (AMZN: NASDAQ) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    The biggest change in my sentiment for the portfolio was my increased conviction of Amazon as a business. Amazon is one of the best businesses in the world. And with economic uncertainty in the air due to geo-politics, I think Amazon will greatly benefit from this period as they have in the past. They will gain market share and consolidate their monopoly. There is no real threat to their company from AI or regulation. And their runway for growth is much larger than the market predicts. Moreover, they are primed for massive margin expansion as the high margin parts of their business continue to grow faster than the low margin parts. I think Amazon will likely be a 10 trillion dollar company in the next decade and the market is greatly undervaluing the company. I more than doubled my Amazon position this quarter.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $270-300 USD</p>
                     <p><strong>Cost Basis:</strong> $194 USD</p>
                     <p><strong>Final Position:</strong> 13 shares</p>
                     <p><strong>Price@31/3/2025:</strong> $190 USD</p>
                     <p><strong>Portfolio Value:</strong> $4,117 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Google (GOOGL: NASDAQ) (A tier)</h3>
                  <p className="text-gray-700 mb-2">
                    I have continued to add to Google this quarter. The uncertainty around its search business from LLMs and regulatory risk remains. The LLM risk is largely overblown. I changed my thesis on Google's monopoly slightly, I no longer think Google has a monopoly on search and it never did. Google has a monopoly in web search, but that only represents a small portion of the overall search pie. There are other search platforms such as Facebook, Amazon etc. These platforms perform searches and help users find what they are looking for, just not on the web but on their websites. And each of these platforms when created only increase the overall search pie. LLM's will do the same thing. As a result, the search business is being vastly underestimated. And Google has said that incorporating LLM's into search is seeing similar monetization while increasing query volume. Regulatory risk is real and uncertainty still looms but in good and bad outcomes, the google business will continue to thrive. And in 9 out 10 scenarios the market usually overestimates regulatory risks and discounts companies too much. In the financials, google saw no weakness and continues to grow as expected. And at current prices and forward predictions, the company is significantly undervalued with modest expectations of growth.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $240-250 USD</p>
                     <p><strong>Cost Basis:</strong> $173 USD</p>
                     <p><strong>Final Position:</strong> 15 shares</p>
                     <p><strong>Price@31/12/2025:</strong> $154 USD</p>
                     <p><strong>Portfolio Value:</strong> $3,850 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">UBER (UBER: NYSE) (A tier)</h3>
                  <p className="text-gray-700 mb-2">
                    Uber has continued to progress steadily, delivering excellent revenue growth and continuing profitability. Moreover, it continues to roll out and announce more AV partnerships. I think smaller companies are realizing the potential of developing the AV software and then attaching it to a car. Then using the power of Ubers network to distribute. The winners in tech have all been companies with entrenched distribution networks. While other companies focus on developing the the AV tech, Uber solidifies its position as the go-to-supply demand aggregator. Uber's intrinsic value continues to grow rapidly while the market continues to discount it unreasonably.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $100-120 USD</p>
                     <p><strong>Cost Basis:</strong> $68.4 USD</p>
                     <p><strong>Final Position:</strong> 40 shares</p>
                     <p><strong>Price@31/12/2025:</strong> $72.9 USD</p>
                     <p><strong>Portfolio Value:</strong> $4,860 NZD</p>
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
                  <h3 className="font-bold text-gray-900 mb-2">Mastercard (MA: NYSE) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    Mastercard had a great quarter delivering strong than expected growth and FCF generation. This company keeps on executing on its long term business plan. They also acquired a small cyber security company to further improve their product offering. Mastercard is a better business than when I bought it and I see no reason to change anything.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $550-570 USD</p>
                     <p><strong>Cost Basis:</strong> $449 USD</p>
                     <p><strong>Final Position:</strong> 4 shares</p>
                     <p><strong>Price@31/12/2025:</strong> $548 USD</p>
                     <p><strong>Portfolio Value:</strong> $3,653 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Meta (META: NASDAQ) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    Meta once again delivered way better than expected growth. I am still baffled how this company delivers 20+ revenue growth at its size. I think my initial thesis is stronger than expected, Meta is driving engagement on their platform like never before. People are glued to their apps, me included. And it is difficult to leave as so much of the world is on these platforms. The advertising demand for this audience will continue to grow as business gets bigger. I think Meta can keep this growth up for the next 5 years. This is a bold claim but if you aren't advertising on Meta, you are losing out to your competition. My conviction of Meta has increased this quarter. Moreover, they deliver some of the best AI models in the world while keeping them open sourced. Which is simply destroying any moat that other companies are trying to build in AI. This further proves that using AI successfully is a better business than developing it. And Meta is still the only non-hardware company to profit significantly from AI thus far.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $700 USD</p>
                     <p><strong>Cost Basis:</strong> $450 USD</p>
                     <p><strong>Final Position:</strong> 3 shares</p>
                     <p><strong>Price@31/12/2025:</strong> $576 USD</p>
                     <p><strong>Portfolio Value:</strong> $2,880 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Mainfreight (MFT: NZE) (A tier)</h3>
                  <p className="text-gray-700 mb-2">
                    Being an NZ company, Mainfreight only reports earnings half yearly so there was no update from the company this quarter. The company I believe is continuing to perform well, despite weak economic growth. Furthermore, Tariffs will hurt their business and growth as trade will reduce. But in previous times of economic uncertainty, Mainfreight has won market share, and this time will be no different. The stock has sold off a little bit and insiders are buying once again. I will continue to hold this company, as it has a completely different risk profile than the rest of the portfolio while having similar expected returns.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $85-90 NZD</p>
                     <p><strong>Cost Basis:</strong> $65.69 NZD</p>
                     <p><strong>Final Position:</strong> 50 shares</p>
                     <p><strong>Price @31/12/2024:</strong> $73.50 NZD</p>
                     <p><strong>Portfolio Value:</strong> $3,675 NZD</p>
                   </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Netflix (NFLX: NASDAQ) (S tier)</h3>
                  <p className="text-gray-700 mb-2">
                    Netflix reported a blockbuster quarter. Delivering well above expectations. Netflix now has 300 million subscribers. And I see no reason why they can't grow to 500 million within the next 5 years. And that is still a small part of their TAM. Netflix user growth is like Meta. When you think they are saturated they will grow again. Netflix became priced at around $1000 this quarter as the market started taking this into account, before trading down with the broader market. Netflix still has years of fast revenue growth ahead now with margin expansion, which will result in large FCF generation. I wanted to add more Netflix, but other opportunities had better risk adjusted returns.
                  </p>
                                     <div className="mt-3 p-3 bg-gray-50 rounded">
                     <p><strong>Intrinsic value:</strong> $1000-1100 USD</p>
                     <p><strong>Cost Basis:</strong> $769 USD</p>
                     <p><strong>Final Position:</strong> 2 shares</p>
                     <p><strong>Price@31/12/2025:</strong> $932 USD</p>
                     <p><strong>Portfolio Value:</strong> $3,107 NZD</p>
                   </div>
                </div>
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
                <p>
                  This section serves to capture some general themes across the quarter. That may or may not cover multiple categories. The two big themes I would like to discuss are Capex announcements by big tech and global tariffs announced by the USA.
                </p>
                
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Big tech capex:</h4>
                  <p className="mb-4">Nearly all big tech companies have announced huge capex investments for 2025.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Company</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Estimated 2024 Capex (USD Billions)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Projected 2025 Capex (USD Billions)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">YoY Growth (%)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Alphabet</td>
                          <td className="border border-gray-300 px-4 py-2">~$45 - $55</td>
                          <td className="border border-gray-300 px-4 py-2">~$75</td>
                          <td className="border border-gray-300 px-4 py-2">~36% - 67%</td>
                          <td className="border border-gray-300 px-4 py-2">AI Google Cloud</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Amazon</td>
                          <td className="border border-gray-300 px-4 py-2">~$78 - $83</td>
                          <td className="border border-gray-300 px-4 py-2">~$100 - $105</td>
                          <td className="border border-gray-300 px-4 py-2">~20% - 35%</td>
                          <td className="border border-gray-300 px-4 py-2">AWS AI</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Meta Platforms</td>
                          <td className="border border-gray-300 px-4 py-2">~$35 - $40</td>
                          <td className="border border-gray-300 px-4 py-2">~$60 - $65</td>
                          <td className="border border-gray-300 px-4 py-2">~50% - 86%</td>
                          <td className="border border-gray-300 px-4 py-2">Servers, AI and networking</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Microsoft</td>
                          <td className="border border-gray-300 px-4 py-2">~$50 - $63</td>
                          <td className="border border-gray-300 px-4 py-2">~$80 - $90</td>
                          <td className="border border-gray-300 px-4 py-2">~27% - 80%</td>
                          <td className="border border-gray-300 px-4 py-2">AI data centres</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-bold">TOTAL</td>
                          <td className="border border-gray-300 px-4 py-2 font-bold">~$208 - $241</td>
                          <td className="border border-gray-300 px-4 py-2 font-bold">~$315 - $335</td>
                          <td className="border border-gray-300 px-4 py-2 font-bold">~31% - 61%</td>
                          <td className="border border-gray-300 px-4 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="mt-4">
                    These are large increase in Capex, and as you can see, they are going primarily towards AI. I also own 3 of these companies. However, the investments are largely in their cloud business or in Meta's case to improve their core business. Which are already very profitable with large runways for growth. These investments are made with great companies with a history of high ROIC. So I am not too worried about the high investments, especially because they are not issuing debt to do so. The risk of not investing is much greater than over investing. These investments will ensure that these companies can keep up strong growth for years to come. The last thing is that, previously invention and advancement was possible at a small scale for small companies. But I think the next 40 years of innovation will require immense amount of capital and research. No one apart from big tech has the means or the will to invest in the future. From AI to Quantum to Augmented Reality to Nuclear Fusion. The size of big tech is one of its biggest strengths.
                  </p>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Tariffs</h4>
                  <p>
                    At the start of April, the USA announced sweeping tariffs for imports into the USA from nearly all countries. This has caused massive uncertainty in the markets, resulting in large draw down of equities globally. The decline is mostly justified since most companies are affected by this. These tariffs are a threat to globalisation and economic specialisation which has been a great force in keeping inflation in check in the developed world for the last 100 years. My strategy is going to be simple, continue buy compounding companies that trade down with/more than the market. However, this situation is changing daily so will have to wait and see what happens.
                  </p>
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
                  Overall, this quarter was interesting. The portfolios companies all are largely in a better position than they were 3 months ago. And I think the portfolio has become more concentrated but with a better risk profile. A few mistakes were made by me but they provide learning opportunities to improve future performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
