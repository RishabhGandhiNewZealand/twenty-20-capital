import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, AlertTriangle, Target, Building2 } from "lucide-react"
import Image from "next/image"

export default function UberAnalysisPage() {
  const metrics = [
    { label: "Current Market Cap", value: "$126B", icon: DollarSign },
    { label: "Expected Value (5Y)", value: "$240B", icon: Target },
    { label: "Expected CAGR", value: "11.3%", icon: TrendingUp },
    { label: "Revenue Growth (5Y)", value: "24%", icon: Building2 },
  ]

  const strengths = [
    "Dominant marketplace with 15+ years of data advantage",
    "Strong brand value synonymous with transport and delivery",
    "Expanding margins with flat expense growth despite 20% revenue growth",
    "Minimal capital expenditures due to asset-light model",
    "Pricing power and monopolistic behavior in existing markets",
    "Network effects creating user stickiness",
    "Rich customer base looking for convenience over cost",
  ]

  const risks = [
    "Autonomous vehicles (robo-taxis) disrupting the business model",
    "Legislative challenges classifying drivers as employees",
    "Regulatory pressures in key markets",
    "Competition from well-capitalized new entrants",
    "Economic sensitivity affecting discretionary spending",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">UBER</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Uber Technologies Inc.</h1>
              <p className="text-gray-600">NYSE: UBER • Technology • Transportation & Delivery</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{metric.label}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Business Description */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Business Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Uber is widely recognized as a ride-hailing and food delivery company. While this constitutes their core business today, the depth and complexity of what they have built are often underestimated. The robust infrastructure they have developed creates a substantial competitive moat, enabling them to sustain dominant market share in existing territories and facilitating seamless expansion into new markets.
            </p>
            <p className="text-gray-700">
              At its essence, Uber's business model revolves around connecting two parties: one offering a service or good, and one seeking to acquire that service or goods. They have established a marketplace for the exchange of these services and goods, presently offering this marketplace for mobility (taxi, scooter, plane, etc.), food delivery, and freight.
            </p>
          </CardContent>
        </Card>

        {/* Core Business Model & Revenue Model */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Revenue Model</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">Within this marketplace, Uber functions as a toll booth, collecting revenue from each transaction:</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Taking 20-30% cut of the overall price of the good or service exchanged
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Charging additional fees such as delivery, service, small order, and convenience fees
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Generating income from advertisements by vendors, especially in food delivery
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Earning through subscription/loyalty programs
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Example Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p className="mb-4">Consider a food delivery transaction where an order is placed for $30 worth of food from a local restaurant. Additional fees bring the total to $40:</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Restaurant receives:</span>
                    <span className="font-semibold">~$20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver receives:</span>
                    <span className="font-semibold">~$10</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Uber retains:</span>
                    <span className="font-semibold text-blue-600">~$10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Performance Charts */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Financial Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Revenue Growth (24% CAGR over 5 years)</h4>
                <div className="relative h-64 mb-4">
                  <Image
                    src="/uber/Uber_Revenue.png"
                    alt="Uber Revenue Growth"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Operating Margin Expansion</h4>
                <div className="relative h-64 mb-4">
                  <Image
                    src="/uber/Uber_Operating_Margin.png"
                    alt="Uber Operating Margin"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Charts */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Key Business Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Monthly Active Users (9% CAGR)</h4>
                <div className="relative h-48">
                  <Image
                    src="/uber/Uber_Monthly_Active_Platform_Users.png"
                    alt="Uber Monthly Active Users"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Total Trips (10% CAGR)</h4>
                <div className="relative h-48">
                  <Image
                    src="/uber/Uber_Trips.png"
                    alt="Uber Trips"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Gross Bookings (20% CAGR)</h4>
                <div className="relative h-48">
                  <Image
                    src="/uber/Uber_Gross_Bookings.png"
                    alt="Uber Gross Bookings"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Efficiency */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Operational Efficiency & Expanding Margins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Expenses Remain Flat Despite Growth</h4>
                <div className="relative h-64 mb-4">
                  <Image
                    src="/uber/Uber_Expenses.png"
                    alt="Uber Expenses"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-700 text-sm">Note how expenses have remained largely flat since mid-2019 while revenue grew 20% annually.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Slow Employee Count Growth</h4>
                <div className="relative h-64 mb-4">
                  <Image
                    src="/uber/Uber_Employee_Count.png"
                    alt="Uber Employee Count"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-700 text-sm">Employee count grew from 27k in 2019 to 30k in 2023 - very slow growth relative to revenue.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow and Stock Compensation */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Free Cash Flow & Stock-Based Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-2xl">
                <div className="relative h-64">
                  <Image
                    src="/uber/Uber_Free_Cash_Flow_SBC.png"
                    alt="Uber Free Cash Flow and Stock Based Compensation"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-center">Free cash flow (orange) is increasing while stock-based compensation (blue) has grown slowly since IPO and is trending down.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Investment Strengths */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Competitive Advantages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Investment Risks */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Key Risks & Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Sections */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Data and Marketplace Advantage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Uber operates as a demand and supply aggregator, effectively matching both sides of the market equation. This strategic positioning enables them to offer competitive pricing during periods of competition and optimize their returns.
              </p>
              <p className="mb-4">
                Uber's significant edge over its competitors lies in its extensive data collection from likely trillions of instantaneous bid price interactions where drivers or riders have either accepted or rejected rides. Moreover, Uber has developed its ability to predict demand from customers and incentivize drivers to meet that demand before it manifests.
              </p>
              <p>
                This vast dataset, accumulated over more than 15 years and enhanced by advanced data science and machine learning models, presents a formidable challenge for any competitor. In the current era of artificial intelligence, this data is exceedingly valuable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Threats Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Robo-Taxi Threat Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p className="mb-4">
                  The development of autonomous vehicles is currently being spearheaded by several major players including Tesla, Waymo, and Baidu. However, there are several reasons why this may not be a significant threat:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Companies need both AV technology and marketplace technology - difficult to achieve at scale
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Partnerships likely (Waymo already partners with Uber in Arizona, Texas, Georgia)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Legislative hurdles around safety and liability pose significant challenges
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-gray-900">Driver Classification Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p className="mb-4">
                  Potential reclassification of drivers as employees through legislation could increase operational costs. However, several mitigating factors exist:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Legislative changes will be contested and vary across regions
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Many drivers may resist classification due to loss of flexibility
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Minneapolis example shows costs can be passed to consumers
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Valuation Analysis */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Valuation Analysis - Scenario-Based Approach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700">
              <p className="mb-6">Expected value calculation based on multiple scenarios with assigned probabilities:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Pessimistic (20%)</h4>
                  <div className="text-sm text-red-700">
                    <p>10% revenue growth</p>
                    <p>11% EBITDA margin</p>
                    <p><strong>Value: $120B</strong></p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Base Case (50%)</h4>
                  <div className="text-sm text-blue-700">
                    <p>12% revenue growth</p>
                    <p>15% EBITDA margin</p>
                    <p><strong>Value: $212B</strong></p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Bull Case (25%)</h4>
                  <div className="text-sm text-green-700">
                    <p>15% revenue growth</p>
                    <p>20% EBITDA margin</p>
                    <p><strong>Value: $433B</strong></p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Worst Case (5%)</h4>
                  <div className="text-sm text-gray-700">
                    <p>Business model fails</p>
                    <p>Stagnant cash flow</p>
                    <p><strong>Value: $25B</strong></p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Expected Value Calculation</h4>
                <p className="text-blue-800 mb-2">V = 0.25 × $433B + 0.5 × $212B + 0.2 × $120B + 0.05 × $25B</p>
                <p className="text-xl font-bold text-blue-900">Expected Value: $240B (11.3% CAGR over 5 years)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Thesis */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Investment Thesis & Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Overall, Uber exhibits strong fundamental attributes and possesses a more significant competitive advantage than often perceived. The company has achieved a critical scale, which should lead to expanding profit margins over time. Consequently, this is expected to generate consistent and growing cash flows for shareholders.
              </p>
              <p className="mb-4">
                Although Uber faces some major challenges, such as regulatory pressures and the advent of autonomous vehicles, these threats present multiple potential outcomes and are not necessarily detrimental to Uber's future. Uber is well-positioned to address and overcome these challenges.
              </p>
              <p className="mb-4">
                <strong>Key Investment Highlights:</strong>
              </p>
              <ul className="mb-4 space-y-1">
                <li>• Revenue growing at 24% CAGR while expenses remain flat</li>
                <li>• Strong network effects and data moat built over 15+ years</li>
                <li>• Asset-light model with minimal capital requirements</li>
                <li>• Multiple expansion opportunities across markets and services</li>
                <li>• Well-positioned for autonomous vehicle transition through partnerships</li>
              </ul>
              <p className="mb-4">
                This uncertainty within an otherwise robust company has created an intriguing investment opportunity. After thoroughly accounting for these risks and evaluating various potential scenarios, the average projected outcome still indicates returns that surpass the market.
              </p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-semibold">
                  <strong>Recommendation:</strong> Equal weight rating in a concentrated portfolio (~10% allocation). 
                  If Uber trades below $75 per share, future returns should generally beat the market.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

