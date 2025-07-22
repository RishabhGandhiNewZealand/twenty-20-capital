import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, AlertTriangle, Target, Building2, Database, Shield, Car, Gavel } from "lucide-react"
import Image from "next/image"

export default function UberAnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">UBER</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Uber Technologies Inc.</h1>
                <p className="text-gray-600">NYSE: UBER • Technology • Transportation & Delivery</p>
              </div>
            </div>
            
            {/* Intrinsic Value Tile */}
            <Card className="border-green-100 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Intrinsic Value</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">$113 USD</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Business Model - Combined Section */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Core Business Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber is widely recognized as a ride-hailing and food delivery company. While this constitutes their core business today, the depth and complexity of what they have built are often underestimated. The robust infrastructure they have developed creates a substantial competitive moat, enabling them to sustain dominant market share in existing territories and facilitating seamless expansion into new markets.
                </p>
              </div>
            </div>

            {/* Core Business Model */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Model</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  At its essence, Uber's business model revolves around connecting two parties: one offering a service or good, and one seeking to acquire that service or goods. They have established a marketplace for the exchange of these services and goods, such as a taxi driver being matched with a passenger heading to the airport.
                </p>
                <p className="mb-4">
                  Presently, Uber offers this marketplace for mobility (taxi, scooter, plane, etc.), food delivery, and freight. This marketplace serves as a foundation for Uber's expansion into new business segments, with home grocery delivery being a rapidly growing segment. Future potential segments could include services like handyman assistance or home cleaning. For instance, users could conveniently arrange for a plumber through the Uber app, illustrating the extensive capabilities of the Uber network.
                </p>
              </div>
            </div>

            {/* Revenue Model */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Model</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Within this marketplace, Uber functions as a toll booth, collecting revenue from each transaction. Their revenue streams include:
                </p>
                <ul className="mb-4 space-y-2">
                  <li>• Taking 20-30% cut of the overall price of the good or service exchanged.</li>
                  <li>• Charging additional fees such as delivery, service, small order, and convenience fees.</li>
                  <li>• Generating income from advertisements by vendors, especially in the food delivery sector.</li>
                  <li>• Earning through subscription/loyalty programs where users pay a monthly fee for benefits like lower fees, encouraging them to spend more on the platform.</li>
                </ul>
              </div>
            </div>

            {/* Example Transaction */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Example Transaction</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Consider a food delivery transaction where an order is placed for $30 worth of food from a local restaurant. Additional fees, including delivery and service charges, bring the total to $40. From this amount:
                </p>
                <ul className="mb-4 space-y-2">
                  <li>• Approximately $20 goes to the restaurant, which may have adjusted prices to offset Uber's commission.</li>
                  <li>• Around $10 is allotted to the driver for their effort.</li>
                  <li>• Uber retains roughly $10 as revenue for facilitating the transaction between the restaurant and the customer.</li>
                </ul>
                <p className="mb-4">
                  This structure is consistent across nearly all Uber services, highlighting the platform's value by enabling providers to reach new clients and offering customers access to otherwise unavailable services, all while creating employment opportunities for drivers.
                </p>
              </div>
            </div>

            {/* Cost Structure */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cost Structure</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber's expenses are covered by the revenue generated from transactions. Key expenses include:
                </p>
                <ul className="mb-4 space-y-2">
                  <li>• Operating the Uber app on AWS, which scales with user growth but becomes more efficient over time.</li>
                  <li>• Sales and Marketing expenditures to continuously attract new customers and enter new markets.</li>
                  <li>• Employee costs, excluding drivers, such as customer service, technical, and administrative staff, which should remain relatively fixed even as Uber expands.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Story and Competitive Edge - Combined Section */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Investment Story and Competitive Edge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Introduction */}
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                To assess Uber's growth potential, we must understand what sets it apart. We'll examine why Uber can sustain its growth despite competition, focusing on its unique strengths and how these helps secure and expand its market position. This begins with Uber's strong brand value that has taken 15 years to create, and it has reached the point where it is synonymous with transport and food delivery. This may not seem like much, but it puts Uber in the same category of brand value as products like Google and the iPhone. Maybe to a smaller degree but the point still stands.
              </p>
            </div>

            {/* Data and Marketplace */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 text-blue-600 mr-2" />
                Data and Marketplace
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber operates as a demand and supply aggregator, effectively matching both sides of the market equation. This strategic positioning enables them to offer competitive pricing during periods of competition and optimise their returns. Specifically, within their mobility business, Uber utilises complex models that operate in real time to provide attractive pricing for both drivers and riders.
                </p>
                <p className="mb-4">
                  For riders, the price must be economical, while for drivers, it must be sufficient to justify their costs and time commitment. Uber's significant edge over its competitors lies in its extensive data collection from likely trillions of instantaneous bid price interactions where drivers or riders have either accepted or rejected rides.
                </p>
                <p className="mb-4">
                  Moreover, Uber has developed its ability to predict Demand from customers and incentivise drivers to meet that demand before it manifests. This is why you only need to wait up to 10 minutes for an Uber to show up regardless of the situation you are getting picked up from.
                </p>
                <p className="mb-4">
                  This vast dataset, accumulated over more than 15 years and enhanced by advanced data science and machine learning models, presents a formidable challenge for any competitor. It could take years for others to amass similar data, by which time Uber will have advanced even further. In the current era of artificial intelligence, this data is exceedingly valuable.
                </p>
                <p className="mb-4">
                  The specific application of AI is less critical; ongoing improvements in their core algorithms will drive efficiencies for many years. Additionally, this wealth of data will facilitate Uber's expansion into new markets more seamlessly, as the data pertains to human willingness to pay. This information can be generalized across various business domains, enabling Uber to implement more effective and personalized pricing strategies.
                </p>
              </div>
            </div>

            {/* Expanding Margins */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Expanding Margins</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber is experiencing rapid revenue growth at a rate of approximately 20%, and it can achieve this without a significant increase in expenses.
                </p>
                
                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Expenses.png"
                      alt="Uber Expenses"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 1: Uber's Expenses since Q1 2018. Note how they have remained largely flat since mid 2019.
                  </p>
                </div>

                <p className="mb-4">
                  Although there are natural fluctuations as with any business, this clearly illustrates Uber's capability to expand its revenue base without incurring substantial additional costs. This represents a critical aspect of Uber's competitive advantage. Uber does not need to hire more employees or increase spending on sales and marketing efforts to sustain its rapid revenue growth.
                </p>
                <p className="mb-4">
                  This is further evidenced by Uber's relatively slow growing employee count over the last five years, Figure 2. Moreover, this stability in employee count has the potential to enhance returns further as less stock-based compensation (SBC) is required to attract and retain sufficient talent.
                </p>

                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Employee_Count.png"
                      alt="Uber Employee Count"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 2: Uber's Employee count has gone from roughly 27k in 2019 to 30k in 2023. A very slow growth relative to revenue.
                  </p>
                </div>

                <p className="mb-4">
                  Figure X in blue shows the decreasing trend in stock-based compensation as free cash flow increases. The management team also plans to further control over SBC through 2025.
                </p>

                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Free_Cash_Flow_SBC.png"
                      alt="Uber Free Cash Flow and Stock Based Compensation"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 3: Uber's Free cash flow (in orange) and Stock based compensation (in blue). Stock base compensation has grown slowly since IPO and is trending down.
                  </p>
                </div>

                <p className="mb-4">
                  Another aspect to consider is Uber's minimal capital expenditures (Capex). Capex refers to the funds used to acquire or build assets, such as purchasing servers for a data centre or vehicles for a robo-taxi fleet. Uber does not need to own the necessary computing infrastructure or its fleet of vehicles. This strategy mitigates Uber's risk related to asset depreciation and maintenance while enabling the company to operate with minimal ongoing investment.
                </p>
                <p className="mb-4">
                  Given the current operating model, it is unlikely that Uber will need to allocate substantial capex to sustain growth. Consequently, this should result in high returns on invested capital for the company. This cost structure essentially implies that while Uber has high fixed costs to run its business, the cost to generate additional revenue is negligible.
                </p>
                <p className="mb-4">
                  Over the past five years, Uber has demonstrated that each dollar of revenue can be effectively translated into net profit and free cash flow. From a broader perspective, this makes sense. Uber has reached a critical mass in its operations and can facilitate more trips and deliveries without increasing its costs as it only needs to compensate the middleman from any new gross bookings.
                </p>
                <p className="mb-4">
                  This lack of expense growth may be perceived as Uber not prioritizing improvements to its application and product. Hiring additional employees does not necessarily guarantee faster app improvements or increased growth. Uber's strategy involves maintaining and optimizing its existing technology while gradually adding value through new features. This approach aims to support sustainable growth in the future.
                </p>
                <p className="mb-4">
                  Additionally, productivity improvements with generative AI will assist Uber in managing costs. Examples include helping engineers develop more quickly and using customer service chatbots to handle customer inquiries.
                </p>
              </div>
            </div>

            {/* Pricing Power and Monopolistic Behaviour */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                Pricing Power and Monopolistic Behaviour
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  This ability to keep costs flat while growing revenue highlights a critical competitive advantage. This gives them immense pricing power in existing and new markets. We can look at the two following scenarios. Let's consider Uber entering a new city where there is an established local player.
                </p>
                <p className="mb-4">
                  When uber enters, it can provide incentives to both riders and drivers to join its platform which will steal market share from the incumbent. This will affect the incumbent disproportionately as their margins will suffer more than Ubers as they must match pricing and incentives on a smaller scale, whereas Uber can subsidise these new markets with the rest of its business.
                </p>
                <p className="mb-4">
                  Critically, Uber can and will do this for a longer period until it becomes the dominant player in the market. Similarly, if a new player tries to enter a market where Uber has a dominant market share, it can quickly exercise its pricing power through incentives at a greater level than any new competitor.
                </p>
                <p className="mb-4">
                  This is because any new competitor must be willing to suffer large losses for an extended period such as Uber did. Unfortunately for these competitors, it is very unlikely they will be as well capitalised as Uber was. In my opinion both scenarios has two potential outcomes, the competitor competes to be dominant and likely goes bankrupt in the process. Or they settle for a smaller piece of the pie and a non-dominant position. Both of which are positive for Uber.
                </p>
                <p className="mb-4">
                  And in the off situation where Uber is unlikely to conquer a market (China), they still have hundreds more opportunities to focus on. Where they are more likely to be successful than not.
                </p>
              </div>
            </div>

            {/* User Stickiness */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User Stickiness</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The above discussion assumes that Customers and Sellers (drivers, restaurants) willing to use Uber even after the incentives disappear even though they may be being charged more. And this is a factor which is commonly held against Uber, people believe that even though Uber may be the dominant player in a market. If a competitor gives sufficient incentive they can convert them. However, this is not the case.
                </p>
                <p className="mb-4">
                  It helps to think about from perspectives of both customers and drivers. Let's say that an alternative ride sharing or food delivery service is 30% cheaper than Uber. A user may use it a few times while it is cheaper, but they will quickly find that over multiple interactions the experience is not as good as Uber. A few reasons outline this:
                </p>
                <ul className="mb-4 space-y-2">
                  <li>• Because my ride might take longer to arrive because they have less drivers than Uber.</li>
                  <li>• Drivers may not be as inclined to take the ride because they are receiving less money from the competitor.</li>
                  <li>• The overall percentage uber takes might be larger, but since they are charging more to the customer, the driver may end up with more.</li>
                  <li>• There is less restaurants on the competitor and restaurants are less likely to sign up because there is less customers on the competitor.</li>
                  <li>• I often will need use multiple apps for ride hailing, food and grocery delivery instead of just one App.</li>
                  <li>• Same for drivers, as they can get a variety of jobs from Uber.</li>
                </ul>
                <p className="mb-4">
                  This in essence creates a positive feedback loop for Uber, where once they have gained their dominant market share, it becomes a lot easier to maintain due to the network effects described above. And it is these network effects which make Uber a better customer experience than competitors even though it may be slightly more costly.
                </p>
                <p className="mb-4">
                  Looking at an example of a competitor, Ola. They came bursting on the Auckland scene in 2018 and initially business boomed "Ola said it had clocked half a million rides in its first six months in the New Zealand market". However, this was not sustainable as Uber was able to match Ola's incentives and more. This led to Ola not being to secure a dominant market share and eventually had to leave the market in 2024. A similar story occurred in Western Australia for Ola.
                </p>
                <p className="mb-4">
                  Uber has achieved this against many different competitors in many different markets consistently. Furthermore, the days are gone where investors will be willing to put up with large losses and incentives, like they did in the early days of ride sharing. This means that competition from other ride sharing companies is unlikely to be as strong as it was previously.
                </p>
                <p className="mb-4">
                  This ability demonstrates Ubers strength to efficiently run its business, which is difficult to replicate no matter who the competitor is.
                </p>
              </div>
            </div>

            {/* Rich Customer Looking for Convenience */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rich Customer Looking for Convenience</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Utilizing Uber is typically regarded as a discretionary expense, as it is not necessary for individuals to rely on Uber for transportation. Despite this, Uber has successfully expanded its user base over the past few challenging years. This growth can be attributed to two things.
                </p>
                <p className="mb-4">
                  Firstly, the demographic of Uber's customers, tend to have higher incomes than average (Source). And secondly, the value proposition that uber provides. The decision to use Uber often hinges on the time savings it offers rather than the cost. For instance, Uber Eats may cost 50% more than dining at a restaurant but saves 30 minutes of time, which is far more valuable to its users. This preference for convenience drives repeat demand for Uber's services.
                </p>
                <p className="mb-4">
                  This can be seen by the fact that the number of trips per quarter has grown at 10% over 5 years, Figure 5, while the active monthly users has grown at 9% CAGR. Additionally, the number of people who can afford such services is increasing globally, particularly in emerging economies like India. This will result in an increase to Uber's total addressable market (TAM).
                </p>
                <p className="mb-4">
                  As people get wealthier across the globe, they will want to use services such as Uber to save time. Moreover, a wealthier clientele is likely to be less impacted by economic downturns, providing some stability to Uber's revenue during tougher times.
                </p>

                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Monthly_Active_Platform_Users.png"
                      alt="Uber Monthly Active Platform Users"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 4: Uber's users on its app who have made a transaction in the last month. Showing consistent growth by 9% over the last 5 years.
                  </p>
                </div>

                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Trips.png"
                      alt="Uber Trips"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 5: The numbers of trips made per quarter on the Uber App. Growing faster than the number of users showing increasing usage per user.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Threats to Uber's Business - Combined Section */}
        <Card className="border-red-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              Threats to Uber's Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Introduction */}
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                If the business described above had no threats, it would easily be one of the best businesses in the world. But there are two large threats to Uber. These are autonomous vehicles and legislation. Autonomous vehicles appear to threaten Uber's long-term growth and monopolistic prospects namely in the form of robo taxis. Whereas legislation classifying drivers as employees would damage Uber's cost structure.
              </p>
              <p className="mb-4">
                It is true that both risks in their worst-case scenario would be devastating for Uber. However, the likelihood that both risks eventuate are blown out of proportion.
              </p>
            </div>

            {/* Robo Taxi */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="h-5 w-5 text-orange-600 mr-2" />
                Robo Taxi
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  The development of autonomous vehicles, particularly from a robo taxi perspective, is currently being spearheaded by several major players including Tesla, Waymo (a subsidiary of Google), and Baidu, each employing different technological approaches. Waymo and Baidu have already reached the stage where they complete hundreds of thousands of rides per week, showcasing the viability and growing adoption of their robo taxi services.
                </p>
                <p className="mb-4">
                  Waymo completed their first ride 9 years ago utilizing Lidar technology. Tesla, on the other hand, relies on camera-based systems and has completed 0 public rides and is at least a few years off doing so. This shows that despite advancements, the maturation of autonomous vehicle technology remains uncertain, like the ongoing evolution of electric vehicles. The industry, though promising, still faces significant challenges before achieving widespread implementation and consumer trust.
                </p>
                <p className="mb-4">
                  The primary threat perceived for Uber is that a future robo-taxi market could operate with better scale and efficiency, offering cheaper prices to users. However, there are several reasons why this may not be a significant threat.
                </p>
                <p className="mb-4">
                  Firstly, companies wanting to offer robo-taxi services need to develop both autonomous car technology and ride-hailing marketplace technology—a difficult feat that only Uber has managed at scale. As previously mentioned, the pricing algorithm employed by Uber are sophisticated and balance both sides of supply and demand equation. New players may struggle to create a competitive pricing environment in which it can cover its own costs and deliver a profit within a reasonable time frame.
                </p>
                <p className="mb-4">
                  This will likely lead to partnerships with Uber to access a pre-built marketplace, as seen with Waymo's partnership with Uber in Arizona, Texas, Georgia. Moreover, Uber has partnered with 10+ AV companies, this helps them improve their app to prepare for the incoming changes. Uber is not only partnering with car AV companies but also those that make smaller robots, which can be used for food delivery.
                </p>
                <p className="mb-4">
                  Secondly, autonomous vehicles will eventually be available for personal use, allowing individuals to set up their own robo-taxi services on Uber. This diversifies the market and prevents a single entity from dominating. Thirdly, significant investment is required to develop and maintain a large robo-taxi fleet. And there is no guarantee that the economics of autonomous cars will become profitable like Uber has after many years of losses.
                </p>
                <p className="mb-4">
                  There is an also a high likelihood that AV's may not be competitive with human-driven cars, especially in developing countries with cheap labour. Uber can continue to expand and incorporate autonomous vehicles into its marketplace during this time. Finally, legislative hurdles around the safety and liability of autonomous vehicles pose a significant challenge to their widespread adoption. This gives Uber time to improve its business while AV technology matures.
                </p>
                <p className="mb-4">
                  In summary, while autonomous vehicles pose a potential threat to Uber's long-term growth, the company's established marketplace, strategic partnerships, and adaptability offer substantial protection. Instead, the likelier outcome is that the app becomes a smart hub for Waymo, Tesla and AV players to come. All of them will compete for customers on Uber's platform much as hotels search for business on Expedia.com.
                </p>
                <p className="mb-4">
                  Uber's management is aware of this challenge and is positioning the company to remain resilient and continue leading the industry. Importantly, the development of robo-taxis is still several years away from mass adoption, providing Uber with time to strengthen its position. Moreover, the worst-case scenario of an economically viable, monopolistic robo-taxi player emerging without any opportunity for Uber to partner is highly unlikely.
                </p>
              </div>
            </div>

            {/* Drivers as Employees */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Gavel className="h-5 w-5 text-purple-600 mr-2" />
                Drivers as Employees
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Another significant threat to Uber is the potential reclassification of its drivers as employees through legislation. Currently, Uber drivers are contractors who choose whether to accept ride offers from Uber without guaranteed work. Proposals would allow gig workers to unionize and collectively bargain for employment terms, such as minimum wage and benefits like health insurance and annual leave, this could significantly increase Uber's operational costs.
                </p>
                <p className="mb-4">
                  If passed, these proposals might force Uber to offer employee protections and consistent pay, resulting in higher operational expenses. This threat, while serious, has several mitigating factors. Firstly, legislative changes will be contested by Uber, slowing down decisions. These decisions will also vary across different regions.
                </p>
                <p className="mb-4">
                  Uber lost a case in New Zealand, yet California courts and public opinion have opposed similar changes (Source). This delay provides Uber with ample time to adapt its business model accordingly. During this period, Uber can continue refining its operations to better accommodate any future legal requirements.
                </p>
                <p className="mb-4">
                  Secondly, many drivers may resist unionization/classification as employees due to the loss of flexibility. As employees, drivers would have fixed shift work hours, no surge pricing benefits and would need to accept all ride offers during their work hours, which may not suit those who drive as a second job. This could reduce Uber's driver pool, affecting its scale, though this might be offset by the inclusion of autonomous vehicles (AVs).
                </p>
                <p className="mb-4">
                  For many drivers, the freedom to choose their working hours is a pivotal aspect of their engagement with Uber, and losing this flexibility could lead to a significant reduction in their willingness to participate. Lastly, employee status for drivers could lead to complex market dynamics.
                </p>
                <p className="mb-4">
                  Guaranteed pay might attract more drivers, lowering prices, but Uber would then reduce driver schedules to match demand, raising prices again. Legislation may allow Uber to potentially fix driver costs while increasing rider prices, benefiting long-term market dynamics despite short-term cost increases.
                </p>
                <p className="mb-4">
                  Minneapolis is a great example of how these dynamics will play out, in December 2024, a minimum rate of $1.28 per mile was mandated for Uber and Lyft drivers. This cost increase is passed onto consumers with an estimated 25% price increase. However, it is unlikely that the ridership will reduce by 25%. As a result of this forced minimum wage, Uber will be able to keep driver wages fixed at the legislative requirement while continuing to slowly increase price. This should help increase Uber's margin in the long run.
                </p>
                <p className="mb-4">
                  Over the next decade, the impact of these threats may diminish as driverless cars become more prevalent in Uber's network. As AV technology advances, the reliance on human drivers could decrease, thereby mitigating the risks associated with driver reclassification.
                </p>
                <p className="mb-4">
                  In summary, while the reclassification of drivers as employees poses a substantial threat to Uber, the company has several avenues to mitigate these risks. Through strategic adjustments, leveraging AV technology, and using its established market presence, Uber can navigate these potential challenges.
                </p>
                <p className="mb-4">
                  The diverse regional legal landscape and the gradual implementation of legislative changes provide Uber with the opportunity to adapt and remain resilient in the face of evolving labour laws. As you can see there are many different paths forward. This uncertainty around this key part of Uber's business is what is weighing the company down and casting doubts.
                </p>
                <p className="mb-4">
                  Regardless, of the direction driver classification goes in, Uber will continue to benefit because it provides a great product that people want to use while creating some form employment for others. Uber overall is a value add for society and thus should be able to weather this storm.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financials with Stable Balance Sheet as subsection */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 text-2xl">Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Main Financials Section */}
            <div>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber has fantastic fundamentals. A quick summary of these financials will be given below and what they mean is given below. Let's start at the top line. Revenue has been growing around 24% CAGR for last 5 years, Figure 6. This is a significantly faster rate than all 3 of Uber's KPI's, Monthly active Platform users, 9% CAGR, Figure 4, Trips, 10% CAGR, Figure 5, Gross bookings, 20% CAGR, Figure 7.
                </p>
                <p className="mb-4">
                  This indicates that Uber has exerted siginifcant pricing power, it can charge more from customers and take a larger cut from its drivers while growing the total number of users and trips. Moreover, there is a low chance for this behavior to slow down over the next few years.
                </p>
                <p className="mb-4">
                  Moving to the bottom line and cashflows, Uber has only recently become consistently profitable. Uber has lost a lot of money but now due its scale it can generate a large amount of profit. The trailing twelve-month Free cash flow graph shows how every quarter, Uber is generating more cash than it has done ever before. This is because of consistent revenue growth supplemented by a stable and slow growing expense base. This has resulted in Uber Uber's Operating margin growing steadily and it should continue to grow into the future.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-6">
                  <div>
                    <div className="relative h-64 mb-4">
                      <Image
                        src="/Uber_Revenue.png"
                        alt="Uber Revenue"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 italic text-center">
                      Figure 6: Uber's Revenue growth since Q1 2018. A 5 year CAGR of 24%.
                    </p>
                  </div>
                  <div>
                    <div className="relative h-64 mb-4">
                      <Image
                        src="/Uber_Gross_Bookings.png"
                        alt="Uber Gross Bookings"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 italic text-center">
                      Figure 7: Uber's Gross booking since Q3 2019. A 5 year CAGR of 20%.
                    </p>
                  </div>
                </div>

                <div className="my-6">
                  <div className="relative h-64 mb-4">
                    <Image
                      src="/Uber_Operating_Margin.png"
                      alt="Uber Operating Margin"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 italic text-center">
                    Figure 8: Uber's Operating margin has gone from significantly in the negative in 2019 and 2020 to nearly 10%.
                  </p>
                </div>
              </div>
            </div>

            {/* Stable Balance Sheet as subsection */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Stable Balance Sheet</h3>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Uber boasts a strong balance sheet, though it currently has more debt than cash available to repay that debt. However, with Uber's robust cash flows, servicing their debt is manageable. They've recently taken on additional debt at reasonable interest rates, likely to ensure short-term liquidity and support small acquisitions, such as Food Panda in Taiwan.
                </p>
                <p className="mb-4">
                  Within the next two years, Uber should accumulate cash and pay down debt as their cash flows increase. A further indication of Uber's financial stability is the recent upgrade of their debt to investment grade by SPGI and Moody's, which surpassed management's expectations. This upgrade underscores the rapid strengthening and stabilization of Uber's balance sheet.
                </p>
                <p className="mb-4">
                  Although Uber may not be cash-rich at this moment, they are not burdened by excessive liabilities and should be able to continue reinvesting in the business while returning value to shareholders in the future.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valuation */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Valuation – Current $140B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                The points discussed above indicate that Uber is a robust business with strong fundamentals, a competitive advantage (which I believe to be stronger than others might perceive), and potential threats that could impact its operations (which I consider to be less significant than others might). Due to these uncertainties, a wide range of scenarios could realistically occur.
              </p>
              <p className="mb-4">
                The calculation presented here differs somewhat from other analyses. We will still forecast the future cash flows of the business. However, instead of discounting them for future value, we will analyse what the market will likely value those cash flows at a future point in time. Subsequently, we will assign a probability to each scenario materializing.
              </p>
              
              <h4 className="text-lg font-semibold mt-6 mb-4">Pessimistic Scenario (20% probability)</h4>
              <p className="mb-4">
                Let's consider the first scenario, which is a pessimistic outlook. In this case, over the next five years, we anticipate that Uber's revenues will grow at an average rate of 10%, which is half of the current year-over-year revenue growth rate. Additionally, if we assume that the Revenue to EBITDA Margin remains unchanged at 11%, it implies that Uber's expenses will increase at the same rate as its revenues, leaving no room for margin expansion.
              </p>
              <p className="mb-4">
                Furthermore, if Uber needs to allocate more capital expenditure (capex) to stay abreast of new technologies, the capex percentage is projected to rise from 0.5% to 1%. With an estimated EBITDA tax rate ranging from 10-20%, Uber's revenue is expected to reach approximately $70 billion, with a free cash flow of about $6 billion.
              </p>
              <p className="mb-4">
                Considering these assumptions, the market might value these cash flows at around 5% due to the declining revenue growth and lack of margin expansion; however, they would still be consistent enough to provide solid returns in the future. This results in a projected future value of $120 billion for Uber in five years, representing approximately a 20% downside from today's market capitalization and roughly 4% negative returns per year.
              </p>
              <p className="mb-4">
                We believe this scenario is unlikely and would only materialize if there is widespread adoption of autonomous vehicles (AV) at a profitable scale, leading to an increase in Uber's costs that cannot be absorbed by consumers. In my assessment, there is roughly a 20% likelihood of this scenario occurring.
              </p>

              <h4 className="text-lg font-semibold mt-6 mb-4">Base Case Scenario (50% probability)</h4>
              <p className="mb-4">
                The second scenario is considered the most stable and likely outcome. In this projection, Uber is expected to achieve an average annual revenue growth rate of 12% over the next five years. This rate is considerably lower than the current revenue growth and the growth in gross bookings. The primary assumption here is that Uber reaches saturation in most of its markets, leading to a slowdown in gross bookings and a corresponding decrease in revenue. This conservative assumption provides a significant margin for underperformance.
              </p>
              <p className="mb-4">
                Additionally, it is assumed that Uber's EBITDA margins will gradually improve to 15%, with an estimated annual increase of approximately 1%. Capital expenditures are projected to remain steady at 0.6% of revenue. A higher tax rate of 20% is also assumed, reflecting Uber's anticipated consistent profitability.
              </p>
              <p className="mb-4">
                Under this scenario, Uber is projected to generate around $74 billion in revenue and approximately $8.5 billion in free cash flow. It is posited that the market may value Uber at a 4% free cash flow yield, resulting in a market capitalization of around $212 billion. This represents an approximate annual growth rate of 8.5% over the next five years.
              </p>
              <p className="mb-4">
                Furthermore, in this scenario, Uber has effectively addressed concerns regarding autonomous vehicles disrupting its business by partnering with providers and demonstrating adaptability to legislative changes. I estimate that there is a 50% probability of this scenario occurring.
              </p>

              <h4 className="text-lg font-semibold mt-6 mb-4">Bull Case Scenario (25% probability)</h4>
              <p className="mb-4">
                The next scenario is the Bull case scenario. In this case, Uber grows revenues at 15% annually, which is less than the current growth rate, ensuring further margin of safety. EBITDA margins expand to 20%, approximately 2% per year, and capital expenditures remain steady at 0.5% of revenue. A tax rate of 20% will be assumed again.
              </p>
              <p className="mb-4">
                In this scenario, Uber will have revenues of $84B and free cash flow of $13B. It is projected that the market will value Uber at a 3% FCF yield. To achieve this, Uber will need to effectively manage the challenges posed by autonomous vehicles (AV) and legislation while maintaining control over expenses.
              </p>
              <p className="mb-4">
                Uber may partner with companies like Waymo or Tesla; however, even if they do not, it is expected that other AV providers entering the market will benefit from Uber's scale. Under this scenario, Uber could reach a market cap of $433B, resulting in an annual compound annual growth rate (CAGR) of 25% from the current market cap of $140B. The likelihood of this scenario occurring is estimated to be 25%.
              </p>

              <h4 className="text-lg font-semibold mt-6 mb-4">Worst Case Scenario (5% probability)</h4>
              <p className="mb-4">
                This leaves 5% unaccounted for, representing a worst-case scenario where Uber's business model fails entirely, and its cash flow remains stagnant at $2 billion. In such a scenario, Uber would likely trade at an 8% free cash flow yield, resulting in a valuation of $25 billion. Although this outcome is highly improbable, it is important to consider even the most unlikely scenarios when making investment decisions.
              </p>

              <h4 className="text-lg font-semibold mt-6 mb-4">Expected Value Calculation</h4>
              <p className="mb-4">
                Now if we take the average expected value of all these scenarios: V = 0.25 × 433 + 0.5 × 212 + 0.2 × 120 + 0.05 × 25
              </p>
              <p className="mb-4">
                V = $240B
              </p>
              <p className="mb-4">
                The expected value of all these scenarios is that Uber will be worth $240B in 5 years' time. This gives a 11.3% CAGR, Uber's weighted return has a significant margin of safety, focusing more on potential setbacks than successes. Uber can exceed these expectations, outperforming the average S&P 500 and surpassing a 6% risk-free rate.
              </p>
              <p className="mb-4">
                If Uber trades below $75 per share, future returns should generally beat the market. Therefore, I recommend an equal weight rating in a concentrated portfolio, ideally around 10%.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Summary</CardTitle>
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
                This uncertainty within an otherwise robust company has created an intriguing investment opportunity. After thoroughly accounting for these risks and evaluating various potential scenarios, the average projected outcome still indicates returns that surpass the market.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Recent Update (4th Dec)</h4>
                <p className="text-blue-800 text-sm mb-2">
                  Edit 1: Uber is at market cap of 126B, this is further 10% discount from 140B. This provides increased annual returns of 2% in all scenarios. The large drop is caused by further fears of Robo taxi.
                </p>
                <p className="text-blue-800 text-sm mb-2">
                  Waymo announced that they will be expanding to Miami without Uber. However, Uber in a recent call suggested that they will be providing fleet operation to Waymo in Miami. Moreover, their recent partnership in Arizona has exceeded Waymo's expectations of ridership.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

