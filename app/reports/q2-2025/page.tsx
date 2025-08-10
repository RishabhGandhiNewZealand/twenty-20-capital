"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Briefcase, AlertTriangle, Target, Plus, Minus } from "lucide-react"
import { getLogoUrl } from "@/lib/company-utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskCurrency, maskShares } from "@/lib/anonymization-utils"

export default function Q2Report2025Page() {
  const { isAnonymized } = useAnonymization()

  const quarterStats = [
    { label: "Q2 Return", value: "+5.18%", icon: TrendingUp },
    { label: "S&P 500 Return Unhedged", value: "+6.05%", icon: DollarSign },
    { label: "Portfolio Value", value: 42098, icon: Target, isCurrency: true },
    { label: "Portfolio Additions", value: 2000, icon: Plus, isCurrency: true },
  ]

  // Portfolio Holdings - calculating proper allocations
  const rawHoldings = [
    { 
      symbol: "UBER", 
      name: "Uber Technologies",
      return: "+28.0%",
      shares: 40,
      usdValue: 3732, // $93.3 * 40 shares
      nzdValue: 6220,
      stockCurrency: "USD",
      tier: "A"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc",
      return: "+14.2%",
      shares: 18,
      usdValue: 3168, // $176 * 18 shares
      nzdValue: 5280,
      stockCurrency: "USD",
      tier: "A"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc",
      return: "+15.3%",
      shares: 13,
      usdValue: 2847, // $219 * 13 shares
      nzdValue: 4745,
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms Inc",
      return: "+16.9%",
      shares: 4,
      usdValue: 3096, // $774 * 4 shares
      nzdValue: 5160,
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "MFT", 
      name: "Mainfreight Limited",
      return: "-8.5%",
      shares: 67,
      usdValue: 2742, // $67.15 NZD * 67 shares * 0.61 USD/NZD rate (Jun 30, 2025)
      nzdValue: 4499,
      stockCurrency: "NZD",
      tier: "A"
    },
    { 
      symbol: "NFLX", 
      name: "Netflix Inc",
      return: "+43.8%",
      shares: 2,
      usdValue: 2680, // $1340 * 2 shares
      nzdValue: 4467,
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "MA", 
      name: "Mastercard Inc",
      return: "+3.7%",
      shares: 4,
      usdValue: 2112, // $528 * 4 shares
      nzdValue: 3520,
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "ASML", 
      name: "ASML Holding N.V.",
      return: "+50.0%",
      shares: 4,
      usdValue: 3992, // $998 * 4 shares
      nzdValue: 6653,
      stockCurrency: "USD",
      tier: "S"
    },
    { 
      symbol: "SPGI", 
      name: "S&P Global Inc",
      return: "+9.9%",
      shares: 5,
      usdValue: 2790, // $558 * 5 shares
      nzdValue: 4650,
      stockCurrency: "USD",
      tier: "S"
    }
  ]

  // Calculate total USD value and allocations
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q2 2025 Report</h1>
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
          {/* Portfolio Performance Overview */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 space-y-4">
                <p>
                  The second quarter gave us a continuation of the uncertainty that started last quarter. It started with liberation day in the US. Where the administration announced very large reciprocal tariffs, this caused a large dip of around 10% in the S&P 500. But over the last few months, these tariffs have been largely removed, and new trade deals are in place. This caused a strong recovery in the market. However, the uncertainty around them is still in place as the administration looks to further its goals. Moreover, we had major escalations in wars across the world, namely the Russia Ukraine and Israel Iran. The USA intervened directly in the Israel Iran war, playing global police and causing a ceasefire.
                </p>
                <p>
                  Overall, the portfolio has performed exactly in line with the index. The performance of the individual stocks was better than the market index. However, the NZD strengthened with respect to the US dollar. This was to be expected with the increased uncertainty around the US markets. The portfolio is currently too small to accurately hedge against USD/NZD fluctuations, it is something I want to do when the portfolio size is greater than $100k USD. This quarter we had no sells and 2 buys. Overall, the portfolio is up 5.18% vs the S&P 6.05%.
                </p>
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
                    <h3 className="font-bold text-gray-900">Google (GOOGL: NASDAQ) (A tier)</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    I have continued to add more to Google this quarter as the market keep the stock price discounted. The narrative still hasn't changed, and I remain unconvinced of it. Moreover, this quarter Google released its Gemini 2.5 family of models which have been at the top of the LMArena charts ever since the release. Despite new flagship models from the other AI players. I think Google is now starting to flex its research and development Genius, kind of like a diesel train that takes a while to get going but won't stop once it's in motion. Moreover, Google has come out with very positive engagement metrics on AI overviews on search. I think in the short term, AI overviews will cannibalize search revenue, but it will make the platform stickier. And I have full confidence that Google will be able to monetize them even better than normal search. Google is tackling the innovators dilemma head on and is not afraid of short-term pain for long term gain. The rest of the business is excelling and being discounted for no reason. A quick sum of the parts valuation as follows: Search with 5 P/S multiple, Cloud with a 15P/S, Google network with a 3 P/S , YouTube and Subscriptions with 8P/S, Other bets/Waymo a 15 P/S multiple. This gives a rough valuation of 2.5T. This does not account for the synergies between the different business segments either. The financials continued to grow as expected and at current prices the company still has good growth prospects.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $240-250 USD</p>
                    <p><strong>Cost Basis:</strong> $173 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(18, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $176 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(5280, isAnonymized, 'NZD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-blue-200 pl-4">
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
                    Mainfreight reported their annual results this quarter, their revenue is up 11% while profit is down 3% before tax. Considering the macro environment, Mainfreight is executing well in all its regions except the USA. This region is struggling to get going at the same speed as others; however, I have faith that over the next 5 years, it will become a profit center. I think they can grow revenue by 8-10% comfortably and they have demonstrated that. Their profitability will improve as they continue to win market share and the macro environment improves, and if it doesn't the company will still do well as I have faith in the management execution ability. Every year they win market share with better service and build better infrastructure to give betters service the moat continues to improve. The company is still lagging the rest of my portfolio, there I think two reasons for this, NZ is not great now as a country, thus capital is slow to go into companies, and since MFT is only listed on the NZX, this further adds to this issue. However, over the long term the value of the company follows its fundamentals. During a pre-earnings dip, I added another $1000 dollars to the company reducing my cost basis. And I will add more if the prices stay below 60$ a share.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $90-100 NZD</p>
                    <p><strong>Cost Basis:</strong> $64.20 NZD</p>
                    <p><strong>Final Position:</strong> {maskShares(67, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $67.15 NZD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(4499, isAnonymized, 'NZD')}</p>
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
                    Mastercard revenue grew faster than expected at 14% despite 3% currency headwinds, as the USD weakens this should help boost revenue growth. The core business is growing quickly despite maturity, and their value-added services + additional paths such as cross borders continue to be excellent long-term drivers. Like I said last quarter, this company keeps on executing on its long-term business plan. Mastercard is a better business than when I bought it and I see no reason to change anything. I think Mastercard is correctly valued now, but the market may still not expect consistent growth ahead for the next 10 years.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $570-580 USD</p>
                    <p><strong>Cost Basis:</strong> $449 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(4, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $561 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(3740, isAnonymized, 'NZD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
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
                    Meta continues to deliver above expectations and people are finally starting to realize the potential that this company has, especially in the age of AI. I think this business is one of the best in the world with a very high barrier to entry. I think that 20%+ EPS growth can continue despite the heavy investments in AI. The company has yet to monetize WhatsApp and threads, which have 1B+ daily active users. Their operating costs are starting to flatline. They now need to prepare their business for AI, which they are doing well, They are pouring massive amount of money into AI, on top of their Infra Capex investments, they bought a share of Scale AI to hire its founder and have poached huge talents from Other key AI players for massive compensation packages at 100M+. I would like to add to this company, but the market is slowly realizing this and is valuing it appropriately.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $720 USD</p>
                    <p><strong>Cost Basis:</strong> $450 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(3, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $719 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(3595, isAnonymized, 'NZD')}</p>
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
                    The story for Netflix remains unchanged. They grew revenue at 14% and profit at 46%. Their operating leverage is now showing. There was an internal Memo leak, where the management is expecting to hit a 1T market cap in the next 5 years. This was in line with my expectations of 500 million subscribers. The market has swiftly priced the company up to 500 million in market cap at a price of $1300 a share. That still gives a 15% return if management meet their targets, but I think Netflix is overvalued now and has valuation risk associated with it now. However, the company is just too good to sell at this stage. It still has years of revenue growth ahead and I think the company will still be around in 10 years. Often the market underestimates margin expansion so selling now would still be a mistake. Even at $1300, I think NFLX will still beat the market in 5 years' time. Letting the winners run.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $1100 USD</p>
                    <p><strong>Cost Basis:</strong> $769 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(2, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $1340 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(4467, isAnonymized, 'NZD')}</p>
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
                    Like last quarter S and P Global continued along its way this quarter, with business as usual. The story remained as it is and the company's performance was within expectations. The biggest news for S&P global this quarter is that they plan to spin out their automotive mobility segment into its individual company. This is interesting news, I think long term this is a great benefit for SPGI. Most likely, when this happens, I will sell any shares in the mobility division to buy more SPGI as I think SPGI will be a higher quality higher margin business afterwards. SPGI lags the market this year in price, but strong fundamentals means no cause for concern.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $620-670 USD</p>
                    <p><strong>Cost Basis:</strong> $510 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(5, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $527 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(4392, isAnonymized, 'NZD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
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
                    My sentiment towards Amazon has gotten even stronger over the past quarter. The company has three main drivers for returns in the future, firstly stable revenue growth driven by their high margin business, this will increase the quality of Amazon's business. Secondly, their existing low margin business is set to benefit greatly from new technologies like AI and automation. An increase in margin of 1% in a 250B dollar business resulted in 2.5B of additional profit. Amazon is probably the leading automation player in the market as their distribution warehouses are already employing hundreds of thousands of robots to serve customers. The market still does not appreciate the scale that this company has. I will be adding to this company early next quarter, with my next lot of capital.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $270-300 USD</p>
                    <p><strong>Cost Basis:</strong> $194 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(13, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $219 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(4745, isAnonymized, 'NZD')}</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-200 pl-4">
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
                    While I did not add to Uber this quarter, the company has progressed steadily. They have executed on their business plan, which to continue growing their network while exercising operating leverage and developing partnerships with AV companies. The company reported a great quarter with 17% revenue growth and 84% growth in FCF, YoY. I think the market is underestimating Uber's operating leverage. Even if the market rates the company to a 5% FCF yield, and revenue growth is only 10% for the next 5 years. I think returns will still exceed 15% from here. The market is catching on and Uber performed well this quarter. I will add to Uber if it dips.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $110-120 USD</p>
                    <p><strong>Cost Basis:</strong> $68.4 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(40, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $93.3 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(6220, isAnonymized, 'NZD')}</p>
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
                    ASML had a quarter of accelerating revenue growth and growing backlog. ASML continues to develop and improve its tech. TSMC's new fabs in Arizona are going to come online soon and as chip demand increases, ASML will be able to provide machines to all upcoming fabs worldwide. And even if China comes out with competitive tech, ASML still has the industry connections and know how to compete. Although, the risks around the Chinese market export restrictions and upcoming Chinese technology remain. There was some positive news that the USA is slowly reducing the restrictions, some software restrictions were removed this past quarter. And hopefully this is the start of more open trade. If this continues then we could ASML back to $1000 by the end of the year.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Intrinsic value:</strong> $900-1000 USD</p>
                    <p><strong>Cost Basis:</strong> $713 USD</p>
                    <p><strong>Final Position:</strong> {maskShares(4, isAnonymized)} shares</p>
                    <p><strong>Price@30/06/2025:</strong> $774 USD</p>
                    <p><strong>Portfolio Value:</strong> {maskCurrency(5160, isAnonymized, 'NZD')}</p>
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
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Tariffs</h4>
                  <p>
                    Lets talk more tariffs, after the initial announcements and further reciprocal tariffs. Things have mostly calmed down, and tariffs have been walked back. And the market has recovered, although the dollar remains slightly weaker. I think the dollar will continue to get weaker through the rest of the year. But that is just a hunch. Moreover, at the start of July, the initial 90 day pauses have worn off and will likely kick back into effect. At this stage the market is unsure of how to deal with this. But I think the general gist of it remains the same as last quarter. The market is fundamentally strong just with macro and geo-political uncertainty. Will continue to buy companies and in the US. Unless there is good opportunity in other markets. Ideally, I would like to add one more global holding to my portfolio, but most of my companies have a large portion of their revenues outside of the US so maybe it is not necessary.
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
                  Overall, this quarter was a dull one from the portfolios' perspective. And that is a good thing. All the companies performed within or exceeded expectation. And overall, the Moat of the portfolio increased this quarter. The trading activity was less this quarter which I look to increase by adding more capital next quarter.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
