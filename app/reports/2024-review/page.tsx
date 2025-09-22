"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Briefcase } from "lucide-react"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { maskShares } from "@/lib/anonymization-utils"
import { getLogoUrl } from "@/lib/company-utils"

export default function Review2024Page() {
  const { isAnonymized } = useAnonymization()
  // getLogoUrl imported from lib/company-utils

  const yearStats = [
    { label: "Portfolio Return", value: "+16.6%", icon: TrendingUp, positive: true },
    { label: "S&P 500 Return", value: "+20.8%", icon: TrendingUp, positive: true },
  ]

  const watchlist = [
    { symbol: "ASML", name: "ASML Holding N.V." },
    { symbol: "FTNT", name: "Fortinet" },
    { symbol: "SNOW", name: "Snowflake" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "TXRH", name: "Texas Roadhouse" },
    { symbol: "COST", name: "Costco" },
    { symbol: "ANET", name: "Arista Networks" },
    { symbol: "TSM", name: "Taiwan Semiconductor" },
    { symbol: "V", name: "Visa" },
    { symbol: "FICO", name: "Fair Isaac Corporation" },
    { symbol: "NOW", name: "ServiceNow" },
    { symbol: "VICI", name: "VICI Properties" },
    { symbol: "FDS", name: "FactSet Research Systems" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">2024 Annual Review</h1>
          <p className="text-gray-600">A comprehensive look at my investment performance in 2024</p>
        </div>

        {/* Year Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {yearStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.positive ? "text-green-600" : "text-red-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Text Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>2024 was the first complete calendar year for my portfolio. This is a summary of the performance and activities of my portfolio. I also review some of the rationale behind my investments for maximum transparency.</p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Summary */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>At the start of this year, I owned two companies in my portfolio, Canadian Pacific Kansas City Railway (CP: NYSE) and Mainfreight (MFT: NZE). I finished the year with a total of 11 holdings.</p>
                
                <p>All new capital was deployed on the NYSE and NASDAQ. The reason for this is that the USA still is the best capital market in the world and will likely continue to be so. It has a very wide moat, and the biggest business of the last 100 years originated there. This is because the availability of capital is by far the most abundant. The types of business I wish to invest in are all listed on these exchanges natively or through ADR's. While these businesses are listed on these exchanges their revenues and profits are diversified across the globe.</p>
                
                <p>The S&P 500 returned 20.8% on a money-weighted basis this year, while my portfolio returned 16.6%.</p>

                <p>A few general thoughts on why I think the portfolio was fairly in line with the index. We did have some underperformance and that was largely contributed by holding Mainfreight as the largest holding in my portfolio for the majority of the year. This meant the performanace was largely tied to the performance of Mainfreight which had mediocore stock performance. Albeit the company did well fundamentally. The underperfomance was counteracted slightly by the NZ dollar getting significantly weaker against the US dollar. Falling from 0.63 to 0.56 through the year. Excluding Mainfreight and FX effects the perfomance of the portfolio was likely in the range of ~30%. </p>

                <div className="my-6">
                  <img 
                    src="/PortfolioJan2024.jpg" 
                    alt="Portfolio allocation Jan 2024"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 1: Portfolio allocation at the start of the year.
                  </p>
                </div>

                <div className="my-6">
                  <img 
                    src="/PortfolioJan2025.jpg" 
                    alt="Portfolio allocation Jan 2025"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 1: Portfolio allocation at the end of the year.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Holdings */}
          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('MFT')} 
                  alt="MFT logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Mainfreight (MFT: NZE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$85-90 NZD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$65.69 NZD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(50, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2024</div>
                      <div className="font-semibold">73.50 NZD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Mainfreight is a freight forwarder, they sell space on trucks, ships, airplanes and warehouses to help a customer with their supply chain. I.e. Helping a wine maker with transporting grapes from the vineyard to the distillery and then to the distribution centre on the other side of globe. Supply chain logistics are a vital part of the world and are becoming more important as the world is globalised.</p>

                <p>Looking ahead, Mainfreight's strategy is straightforward: leveraging its substantial profitable operations in New Zealand and Australia. These markets are expected to continue expanding, with Mainfreight increasing its market share through superior service and ongoing investments, such as the rail-integrated Moore Bank Facility in Sydney. It can then invest these profits into expanding in Asia, North America, and Europe. North American and European branches are expected to generate consistent profits within five years. They have recently opened a branch in India and plan to expand into Africa within the next decade. The company has a long-term vision and has successfully executed its strategy for 47 years. And as the network grows, they will increase market share from new and existing customers who can easily ship goods further. Working in the logistics industry, I know the power of this network effect and the efficiencies in operations that can be had with emerging technologies. Mainfreight also fosters a culture of internal promotion leads to high employee satisfaction. Moreover, management and the board regularly purchase the company stock with their own funds, this signal strong confidence in the company's prospects.</p>

                <p>I started the year with a substantial position in Mainfreight on the NZX, initially valued at approximately {isAnonymized ? "***" : "5600"} NZD. This company has yielded a 9.27% return, including dividends, over the past year, while the NZX50 index increased by 11.03%. I still firmly believe that Mainfreight is the best public company in New Zealand, which is why it remains my sole NZX holding.</p>

                <p>Although the stock's performance was somewhat underwhelming, the company's fundamental growth has been strong, and its strategic narrative remains intact. If management continues to strengthen the company's fundamentals, I will maintain my investment. However, I reduced my stake to about {isAnonymized ? "***" : "3600"} NZD, acknowledging that I had an emotional over concentration in the company. As my portfolio grows, I will add more to this company during dips.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('CP')} 
                  alt="CP logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Canadian Pacific Kansas City Railways (CP: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$90-110 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$79.31 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(20, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$72.37 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>CPKC is a class 1 North American railroad company with a network spanning southern Canada and the US upper Midwest, expanding into the southern United States and Mexico after merging with Kansas City Southern Railways. This unparalleled network transports freight such as grain, coal, potash, automobiles, and consumer goods, providing significant cost and speed advantages over trucking/shipping. CPKC's irreplicable network establishes a strong competitive moat, enabling superior service and thus allowing market share gains. The experienced management team hopes to achieve significant synergies in the coming years while maintaining stable cash flows and investing in the legacy KC network. The company also aims to invest in new technologies like hydrogen locomotives, further strengthening the company's moat.</p>

                <div className="my-6">
                  <img 
                    src="/CPKC.jpg" 
                    alt="CPKC rail network post-merger"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 3: CPKC rail network post-merger. It spans the entire North American continent, enabling unparalleled service.
                  </p>
                </div>

                <p>In 2024, I held {isAnonymized ? "***" : "19"} shares, and the stock returned roughly -9%, despite increasing revenues by 6% and improving margins amid challenges like a union strike and a major derailment. The company adhered to its capex guidance, demonstrating discipline. The stock peaked at around $91 this year but declined due to strikes, a derailment, and proposed tariffs from incoming President Trump. Overall, I was pleased with the company's operating performance. They increased the intrinsic value of the company. The next 2-3 years are crucial for CPKC to demonstrate revenue increases, margin improvements, effective challenge navigation, and capital returns to shareholders. I believe they can exceed these expectations, leading to excellent returns over the next decade. I purchased {isAnonymized ? "***" : "one more"} share of CPKC at year-end as the stock dipped and will add more if it dips further.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('UNH')} 
                  alt="UNH logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">United Healthcare Group (UNH: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$550-600 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="font-semibold">Position Sold</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>United Healthcare is the largest insurance company in the world by revenue. They provide health insurance (80% revenue), health services, value-based care and data analytics to individuals and enterprises alike in the United States. The business is simple to understand, and the story is compelling. As the population and age of that population in the United States increases steadily. United Health's TAM expands naturally. This is a secular trend with nothing to stop it. They can further increase their premiums and pricing for their products above inflation as health care is an essential that people will pay for. They can further increase their business efficiency through better risk models and AI. This provides a very long runway of solid 9-11% revenue growth and margin expansion. And at the start of the year there was very little long-term risk.</p>

                <div className="my-6">
                  <img 
                    src="/UNH.png" 
                    alt="United Healthcare Group business structure"
                    className="w-full rounded-lg border"
                  />
                </div>

                <p>A great buying opportunity opened when 2 short-term bad news events caused a 20% sell-off. Firstly, there was a cyber-attack on a subsidiary of the company resulting in large loss of medical information to hackers and secondly, the final Medicare advantage payments for 2025 came below expectations. This will reduce revenues for UNH in 2025. However, both events have little long-term implications. Thus, I bought a roughly {isAnonymized ? "***" : "2500"} NZD position in the company at an average price per share of $493 USD over the course of Feb-June. The position then recovered over the year as UNH demonstrated that it can effectively navigate these changes and deliver on its goals.</p>

                <p>In early December, I decided to sell my position due to a significant event: the assassination of United Healthcare's CEO, Brian Thompson, in midtown New York on the morning of the annual investor day. This incident brought intense media scrutiny to the American healthcare industry. I discovered the unethical practices within the industry, such as the high rate of claim denials by health insurance companies, with United Healthcare leading at 33%. It's clear the US healthcare system exploits customers, many of whom have no other choice due to employer-provided insurance. Importantly this event greatly increased the risk of healthcare insurance reform due to public pressure could harm the company's long-term prospects.</p>

                <p>I sold at an average price of $582 USD and used the cash for another buying opportunity that was waiting for me. I was fortunate with this trade, but time will tell if it was the right decision.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('META')} 
                  alt="META logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Meta (META: NASDAQ)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$520-580 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$450 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(3, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$585 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Meta is the world's largest social media and advertising company, enabling better communication through Facebook, Messenger, Instagram, WhatsApp, and Threads. Combined, these apps have 3.29 billion daily active users. Meta's growth is driven by network effects, making it essential if users wish to stay connected with friends and family.</p>

                <div className="my-6">
                  <img 
                    src="/META.png" 
                    alt="Meta's Family of Apps"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 4: Meta's Family of Apps. Most people use at least 1 of these every day.
                  </p>
                </div>

                <p>The story for Meta is quite unique. Meta continues to expand its already massive user base with the launch of Threads, capturing market share from X. With 100 million daily active users on Threads, Meta is poised for further growth. The company's strong network effects and global population increase are expected to drive ~4% annual user growth over the next decade. As Meta's user base grows, it becomes increasingly attractive to advertisers, which in turn boosts the demand for ad space. While the company has likely reached the limit on the number of ad impressions per person, this heightened demand allows Meta to raise ad prices above inflation. This is due to the finite time users can spend on any application, making that time more valuable for advertisers. Currently Meta makes $46 per user on their platform per year. Additionally, further monetization of WhatsApp and Threads presents additional growth opportunities. AI-driven engagement tools will enhance both user and advertiser experience. Meta is also heavily investing in Reality Labs and AI. By building advanced compute and networking capabilities, Meta aims to develop world-class AI models and open source them to democratise AI. VR and AR technologies are being developed as potential future computing platforms, bolstered by natural language AI. Though there's no guarantee these investments will pay off, but if it does Meta will become the most valuable company in the world. However, in my current valuations only consider future expenditure and exclude potential revenue from Reality Labs and AI due to the uncertainty.</p>

                <p>I decided to invest in Meta after noticing I was spending more time on Facebook while seeing more ads. I believed others felt the same, so I started a small position in March. Despite a good earnings report, the stock dropped 15%, likely due to slower daily active user growth and increased Capex forecasts for 2024 and 2025. However, the fundamentals were sound. I increased my investment to {isAnonymized ? "***" : "3.2812"} shares at an average of $450 USD each. The stock rose to around $585 USD by year-end, where I reduced my holdings to {isAnonymized ? "***" : "3"} shares as I had another opportunity at year end. Meta now comprises ~9% of my portfolio, and I won't add more unless the stock dips while maintaining strong fundamentals. Overall, happy with the performance of the company and stock.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('CRM')} 
                  alt="CRM logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Salesforce (CRM: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$280-320 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$250 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(7, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$334 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Salesforce is a software-as-a-service provider in the enterprise space. The company offers a suite of best-in-class applications for sales, service, marketing, commerce, data, and IT, all integrated on a single platform. These tools increase employee productivity and enable companies to better satisfy the needs of both current and prospective customers.</p>

                <p>Salesforce's competitive advantage and growth potential stem from two main factors. Firstly, their product is deeply integrated into businesses, resulting in high switching costs in terms of time and money. The product provides an excellent ROI for most companies, making it essential for large enterprises. Salesforce offers a top CRM platform. Even if a company considers switching, migrating all customers and data to a new platform is a significant effort, acting as a deterrent and allowing Salesforce to increase its pricing over time. Secondly, Salesforce continues to develop or acquire complementary products like Agent Force, which uses the existing platform, data, and integrations to optimize processes with AI. These products enhance efficiency and business decision-making, satisfying and expanding their customer base. Upselling these additional products allows Salesforce to deliver more value and create new revenue streams.</p>

                <p>I invested in Salesforce when the stock price declined by 20% after a weak Q1 2025 earnings report and increased uncertainty regarding AI's impact. Concerns were raised that generative AI might replicate Salesforce applications. While feasible on a small scale, recreating the comprehensive Salesforce platform would be challenging. I saw a buying opportunity at a price below its intrinsic value and initiated a half position after the dip. Over time, I grew more confident in the company's long-term growth prospects, especially with the positive shift in the AI narrative following the introduction of Agent Force. I increased my holdings to a full position, acquiring {isAnonymized ? "***" : "seven"} shares at an average cost of $253 USD per share. This stock has been my best performer this year, delivering a 67% money-weighted return. The stock has since climbed closer to its fair value, and I believe Salesforce can continue growing revenues and expanding margins, potentially achieving a CAGR of FCF exceeding 20% over the next 5-10 years. I do not plan to add to this position unless the stock experiences a similar dip, as it is currently my largest holding. I feel I got quite lucky with the timing of the company dipping and this year's gains, hopefully time will continue to prove that this is an excellent company.</p>

                <div className="my-6">
                  <img 
                    src="/CRM.png" 
                    alt="CRM stock performance over 2024"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 5: CRM stock over 2024. With the dip that allowed me to start and build a position in Salesforce, circled in red.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('MA')} 
                  alt="MA logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Mastercard (MA: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$500-550 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$448 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(4, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$527 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Mastercard is a financial payments processor and service provider that facilitates instant financial transactions between merchants, banks, and customers, collecting small fees that add up as they process trillions of dollars in transactions annually. Its services are nearly ubiquitous worldwide, making the brand synonymous with electronic payments. By enabling banks to give customers access to their funds and merchants access to customers' funds through its network, Mastercard has created immense switching costs for both groups, reinforcing its network effect and strengthening its moat, matched only by Visa. Heavy global regulation is the only significant threat to this moat. In addition to processing payments, Mastercard offers value-added services like cybersecurity solutions, further enriching its moat and boosting revenue.</p>

                <div className="my-6">
                  <img 
                    src="/MA.png" 
                    alt="Mastercard network diagram"
                    className="w-full rounded-lg border"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    Figure 6: This is how the MasterCard network works. This is MasterCard's moat.
                  </p>
                </div>

                <p>Now that we understand the moat. The investment thesis is simple. There are three growth drivers. Firstly, about 37% of transactions worldwide still use cash. This will gradually shift to electronic payments as the world modernizes, benefiting MasterCard. Secondly, MasterCard is expanding into new global markets, increasing transaction volume and enabling more cross-border transactions, which have higher margins. Thirdly, as the global economy grows, people will spend more on the MasterCard network. Combined, these factors suggest MasterCard can grow revenue by 10-12% annually for the next decade. With 2% share buybacks and some margin expansion, I believe a FCF per share CAGR of 15% is realistic over the next 5-10 years.</p>

                <p>Around mid-2024, the Federal Commerce Commission and other countries took regulatory action over the "high" fees and anti-competitive behaviour of Mastercard and Visa. Combined with slightly weak earnings reports in May and July, the stock traded down more than it should have given the fundamentals are still intact. However, I believe the fees are justified for the security and convenience provided, and significant deterioration of the moat from regulatory action is unlikely. Moreover, Mastercard's strong international presence and diversified revenues mitigate regulatory risks from any single country. So, I decided to build a position over June to August of {isAnonymized ? "***" : "4"} shares at an average price of $448 USD, which gave me a decent margin of safety. MasterCard was chosen over Visa due to its slightly higher growth prospects and larger international exposure. I consider it one of the best and safest long-term investments, and plan to add more shares in the future.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('MSCI')} 
                  alt="MSCI logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Morgan Stanley Capital (MSCI: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$600-650 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$495 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(1.23, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$600 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>MSCI is a financial data company that provides market indexes, ESG and Climate data, and other financial analytics. These data products are used by many financial institutions for various purposes such as indexed product creation (e.g., ETFs, mutual funds), performance benchmarking, portfolio construction, and rebalancing. Without these products, many financial institutions would face challenges in accurately conducting parts of their business. These products are typically consumed on two different bases: recurring subscriptions and asset-based fees. Recurring subscriptions are for ongoing risk assessment products, while asset-based fees are collected as a percentage of assets under management using an MSCI product (e.g., if Vanguard provides an MSCI index ETF, they will collect a small amount for every dollar under management). Both streams of income are highly consistent and recurring. Additionally, MSCI has established itself as a reputable brand with trusted data, which sustains demand for its products and acts as a competitive advantage.</p>

                <p>MSCI's growth prospects are supported by three main factors: the global expansion of passive investing and ETF markets, which rely on MSCI's indexes and provide a steady stream of increasing asset-based fees; the increasing importance of high-quality data for AI and machine learning applications in financial markets, where MSCI is well-positioned to meet this demand; and MSCI's ability to innovate and offer new products tailored to the evolving needs of financial institutions, such as ESG and climate data. These factors indicate that MSCI has potential for sustained revenue growth in the coming years. The scalability of their business model will also enable further margin expansion. With both these factors, I expect MSCI to grow FCF by 15%+ per year for a long time.</p>

                <p>I began investigating MSCI as I regularly work with data products and wanted to identify some of the leading producer and distributor globally. This led me to MSCI, and I commenced research after a slightly below-expected earnings report caused the stock to decline by 15%. At that time, I did not possess sufficient information about the company to make an investment. Following comprehensive research before its next earnings report in July, I initiated a partial position with {isAnonymized ? "***" : "1.23"} shares at an average price of $495 USD. The stock appreciated rapidly before I could complete my position. Nevertheless, the company's fundamentals continue to improve each quarter, and I plan to buy more during market dips over the upcoming year.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('AMZN')} 
                  alt="AMZN logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Amazon (AMZN: NASDAQ)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$200-300 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$174 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(6, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$219 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Amazon is a conglomerate that conducts business through three main segments: online retail, cloud computing, and video streaming. All three of these segments are among the best in their respective classes, each with strong competitive advantages. The retail business has the largest distribution network in the world and is extremely customer-focused, making it attractive for both third-party sellers and customers. AWS, their cloud computing unit, is the largest of the three major cloud providers, supporting the entire tech infrastructures of thousands of companies, making it extremely sticky. Amazon Prime Video is a top three streaming service offered for free with an Amazon Prime membership, providing a cross-selling advantage and a loyal subscriber base.</p>

                <p>Amazon has always had the promise of generating immense cash flows. However, the company often reinvests these earnings into expanding its business. For example, in 2021, they overhauled their retail distribution network and doubled their capacity. In 2024, they invested heavily into AWS to prepare for AI workloads. This behaviour is expected to continue, as Amazon frequently expands into new businesses and is willing to take risks, some of which fail, but the successful ones more than make up for it, such as AWS. This approach increases Amazon's Total Addressable Market (TAM) but also makes the company difficult to value. Nevertheless, their core businesses have grown so significantly that they should generate large free cash flows in the future. Additionally, the new CEO's focus on efficiency and profitability should enhance this growth.</p>

                <p>Looking ahead, Amazon's retail business is expected to grow by mid-single digits per year as more shopping shifts online, with Amazon poised to gain a larger market share due to their superior service capabilities. Their third-party seller services are also expected to grow by approximately low teens, leveraging Amazon's extensive reach and distribution network. AWS is anticipated to continue growing mid-teens per year as the shift from on-premise computing to cloud computing increases, and as existing customers increase their compute workloads. The subscription business should also grow as more people recognize the value proposition of the Prime membership. Additionally, Amazon is massively expanding their advertising business, which is already a $58 billion per year business growing at 20%. They have a huge platform with more demand than supply, allowing for significant scaling opportunities. The key point to note with all this growth is that the high-margin parts of Amazon's business are growing much faster than standard retail, enabling Amazon to expand margins while sustaining low to mid-teens overall growth. Moreover, there are no foreseeable disruptions to their core businesses, giving Amazon full control over their future with a very long runway for continued growth.</p>

                <p>I started a half position in Amazon before their August earnings report, and after the earnings report, the stock dipped 13% due to slightly slower-than-expected AWS growth by 1%. This larger-than-expected drop allowed me to build out my full position of {isAnonymized ? "***" : "6"} shares at an average cost of $174 USD. The stock recovered towards the end of the year with the general market and accelerating AWS growth. Overall, I am very pleased with the company's performance and look forward to seeing how it continues to perform. I also plan to add more shares if prices stay at current levels, as I believe the expected return on Amazon remains excellent even at current prices.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('NFLX')} 
                  alt="NFLX logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Netflix (NFLX: NASDAQ)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$950-1100 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$769 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(2, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$891 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Netflix is an online streaming service that produces, buys and licenses content to stream to 300 million+ users worldwide. It really is a simple business to understand. They charge a monthly fee which is far below the price of a cable tv subscription. And offer multiple tiers of subscription to suit the customers' needs. They produce a wealth of content (arguably of varying quality) but with such breadth that everyone is bound to find something that they like. Moreover, as Netflix's scale has grown it has become more attractive to other media companies as licensing destination. Their moat is their scale, their platform is very efficient to run, and they can produce more content than anyone else at a cheaper best cost. This means that if people can only choose one subscription, they will pick Netflix because it has the widest variety of content available.</p>

                <p>This makes the investment story very straightforward. Netflix has a massive growth potential; they are only at 282M users. I think this can grow to 500M+ over the next 10 years as they expand globally and continue to take share for legacy cable media. Secondly, in their established markets, they can raise prices by 5-8% per year without significant churn as the alternative is paying $70+ for a monthly cable tv subscription, which doesn't have the same wealth of on demand content. Thirdly, Netflix is expanding into other adjacencies such as gaming and sports. They recently streamed the NFL on their platform. This further increases the value proposition of Netflix and increases user retention. Next, Netflix has introduced Ad's into their platform. And with such a captive audience, this ad space is very valuable. By offering the ad tier as a discounted subscription they also lower the barrier to use the Netflix platform which increases customer acquisition. And lastly, they can do all of this without significantly increasing their cost base as the infrastructure and content can support more users without a large increase in investment. All these factors provide a massive growth path for Netflix's earnings.</p>

                <p>I started a position in Netflix as I realized that even at its "high" valuation, the market is still severely undervaluing the company given its prospects. I bought {isAnonymized ? "***" : "2"} shares across the year with an average price of $769 USD. I would still be happy to add Netflix at its current valuations.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('UBER')} 
                  alt="UBER logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Uber (UBER: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$100-130 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$75 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(35, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$60 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Uber is a ride-hailing and food delivery service company; they have built a robust infrastructure that supports its dominant market position and facilitates seamless expansion into new territories. The company's core business model revolves around connecting service providers and consumers through its marketplace, generating revenue from transactions by taking a percentage cut and charging various fees. The network effects and years' worth of data on their platform act a stronger than perceived moat against competition and protects against the relatively low switching costs of the business.</p>

                <p>Uber's growth story is straightforward to understand. Firstly, it can increase the number of users and drivers through market expansion and deeper penetration in existing markets. Next, Uber can leverage its existing infrastructure to maintain stable operational costs while their monopoly-like status in many regions allows them to exercise pricing power, further enhancing margins. Lastly, their advertising business, which already generates $1 billion annually, presents significant growth potential.</p>

                <p>While regulatory changes and the advent of autonomous vehicles pose potential threats, Uber's experienced management is adept at navigating these challenges and is creating strategic partnerships with autonomous vehicle providers. I anticipate that concerns about AV's will diminish over the next two years, positioning Uber as a net beneficiary of the autonomous vehicle movement.</p>

                <p>In the last quarter of the year, my increased use of Uber's services led me to believe that the company was experiencing increased user engagement. Researching further, I found this to be true; Uber's user base and usage frequency were steadily rising alongside their profitability. Despite this, the market sentiment towards Uber declined due to concerns over the impending threat of autonomous vehicles and a slight miss on their gross booking numbers.</p>

                <p>Seeing this as an opportunity, I completed a position of {isAnonymized ? "***" : "35"} shares at an average cost of $68 USD. I plan to increase my stake to 15% of my portfolio while the price remains below $75 USD, as this should provide a sufficient margin of safety.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('SPGI')} 
                  alt="SPGI logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Standard and Poor Global (SPGI: NYSE)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$600-700 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$514 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(2, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$498 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>S&P Global is known for two main things: its indexes, namely the Dow Jones and S&P 500, and its credit rating business. Both these businesses are world-class and possess incredible brand value. The credit rating business charges a fee to rate a company's debt, which usually saves the company interest, making it worthwhile to get the debt rated by S&P. Additionally, they have expanded their market intelligence and data product business, like MSCI. I think of SPGI as very similar to MSCI, except with a different set of data products and a much larger credit rating business. This makes the business slightly more cyclical, but nonetheless predictable. Their moat is their deeply entrenched brand name in the world of American and global finance. Even after the 2008 financial crisis, in which S&P Global played a crucial antagonist role, the brand still survived and thrived. If the brand can survive that, I'm pretty sure it is as bulletproof as they come.</p>

                <p>The story for S&P Global is driven by three factors. First, their recurring sources of revenue from indexes and data products will continue to grow with increasing assets under management and increased demand for these products as the world increasingly relies on data. Second, the recent acquisition of IHS Markit bolstered their data product business and competes their other verticals. This acquisition was completed three years ago, and we are now seeing the synergy improvements that enhance margins while enabling further growth. Lastly, all the debt issued during the COVID pandemic needs to be re-rated as it comes due, a cycle that repeats every five years. During this time, S&P Global can increase prices more than before because companies must get the debt rated to save money. It is cyclical but with great predictability. With all these factors combined, I believe SPGI can provide very predictable 12%+ FCF growth for decades to come.</p>

                <p>I started following S&P Global around the same time as MSCI, and while there haven't been any large dips this year, some uncertainty around the timing of interest rates has caused a little bit of volatility. However, in the long run, it doesn't matter what happens to interest rates; the debt must be reissued before it comes due. With higher rates, it might be slightly later, but it will happen. I was happy to buy this company with a lower margin of safety due to its predictability. Thus, I started a position of {isAnonymized ? "***" : "2"} shares at an average cost of $514 USD when I sold out of UNH. I will happily add more as the company greatly enhances the quality of my portfolio.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getLogoUrl('GOOGL')} 
                  alt="GOOGL logo"
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex-1 flex items-center">
                  <CardTitle className="text-gray-900">Google (GOOGL: NASDAQ)</CardTitle>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 min-w-fit">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Intrinsic Value</div>
                      <div className="font-semibold">$220-260 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Basis</div>
                      <div className="font-semibold">$174 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Final Position</div>
                      <div className="font-semibold">{maskShares(11, isAnonymized)} shares</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Price @31/12/2025</div>
                      <div className="font-semibold">$189 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>Google is the world's leading internet search engine with over 90% market share, making it a ubiquitous tool with more than 3 billion monthly users. They generate a large portion of their revenue through advertising on Search and YouTube. Additionally, Google Cloud, the third-largest cloud provider globally, has recently turned profitable, with margins increasing from 2% to 17% in the last two years while growing faster than competitors. Google's diversified revenue streams from world-class assets provide significant predictability for future investments. Additionally, emerging ventures like Waymo and Quantum computing could potentially generate future revenue.</p>

                <p>The growth strategy for Google is focused on expanding ad impressions and pricing across their services, despite losing 3% market share in the last two years due to the rise of Gen AI. This shift has not impacted their revenue at all, and the Search product continues to improve. Additionally, the continued growth and profitability of Google Cloud are expected to drive future performance, supported by investments in AI and data centre infrastructure. Google's effective reinvestment in their business over the past decade has resulted in the highest net income of any company globally on a trailing twelve-month basis, positioning them for 10-15% top-line growth over the next decade.</p>

                <p>I invested in Google this year following judicial rulings affirming its status as an illegal monopoly, which I agree with as it has achieved this through not only superior products but lucrative anti-competitive deals, this monopoly currently poses no harm and continues to innovate. Moreover, concerns over AI's potential disruption of the search business and resultant stock volatility, I believe Google will navigate these challenges successfully through innovation and legal strategies. Consequently, I acquired {isAnonymized ? "***" : "11"} shares at an average price of $174 USD in early December, following the sale of my UNH holdings. I consider Google undervalued at current prices and plan to increase my stake throughout the year.</p>
              </div>
            </CardContent>
          </Card>

          {/* Closing Thoughts */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Closing Thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose text-gray-700">
                <p>This ended up being a much longer write than initially anticipated, going forward from next year. I expect this review to be a lot shorter as I don't expect to add too many new positions. I will mostly give an update on the performance of my existing companies, rather than describing the moat and investment case. I will only do that for my new positions.</p>

                <p>As of now, I have a few companies on my watchlist in no order. ASML, FTNT, SNOW, MSFT, TXRH, COST, ANET, TSM, V, FICO, NOW, VICI, FDS. However, I think my portfolio is fairly high quality already and still has many undervalued companies, that I would prefer to add to. So, nothing may arise of this watchlist.</p>

                <p>Overall, all of my companies executed their vision and I am pleased with their performance. I quite liked the way I started many of the positions. I bought an initial position in a company I like at a reasonable valuation, usually before earnings and then if it dipped after earnings I could add more at a discount. This was largely possible due to some very volatile earnings this year. And I hope this behavior continues.</p>

                <p>Heading into 2025, the main goals are to continue regular contributions into the portfolio. I wish to add another {isAnonymized ? "***" : "25k"} into the portfolio and hopefully reach a total portfolio of value {isAnonymized ? "***" : "60k"}. The last 2 years have been excellent, so I expect the coming years to be a bit weaker but that's just a guess. The market could go up another 20% for all I know.</p>

                <p>Hopefully, you enjoyed reading this summary.</p>
              </div>
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card className="border-blue-100 mb-8">
            <CardHeader>
              <CardTitle className="text-gray-900">Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {watchlist.map((stock) => (
                  <div key={stock.symbol} className="bg-gray-50 rounded px-3 py-2 text-center">
                    <img 
                      src={getLogoUrl(stock.symbol)} 
                      alt={`${stock.symbol} logo`}
                      className="w-6 h-6 rounded mx-auto mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="font-bold text-gray-900 text-sm">{stock.symbol}</div>
                    <div className="text-xs text-gray-600">{stock.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
