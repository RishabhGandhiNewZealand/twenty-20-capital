import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { parseCSVData } from '@/lib/portfolio'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'

// Fetch unique company names from portfolio data
async function getPortfolioCompanies(): Promise<string[]> {
  try {
    const companies = new Set<string>()
    
    // Get portfolio data directly
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Add current holdings
    holdings.forEach(holding => {
      if (holding.name) {
        companies.add(holding.name)
      }
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      if (position.name) {
        companies.add(position.name)
      }
    })
    
    // Also get raw trade data to ensure we capture all historical companies
    try {
      const csvContent = await downloadTradeDataFromBlob()
      const trades = parseCSVData(csvContent)
      trades.forEach(trade => {
        if (trade.name) {
          companies.add(trade.name)
        }
      })
    } catch (error) {
      logger.warn('Could not fetch raw trade data for complete company list:', error)
    }
    
    const companyList = Array.from(companies)
    logger.info('Found portfolio companies:', companyList)
    
    return companyList.length > 0 ? companyList : [
      // Fallback list if no companies found
      "Microsoft",
      "Tesla", 
      "Fonterra Co-operative Group",
      "Fletcher Building",
      "Meta Platforms",
      "Salesforce",
      "Alphabet",
      "Amazon",
      "Mainfreight"
    ]
  } catch (error) {
    logger.error('Error fetching portfolio companies:', error)
    // Return a fallback list if data fetch fails
    return [
      "Microsoft",
      "Tesla", 
      "Fonterra Co-operative Group",
      "Fletcher Building",
      "Meta Platforms",
      "Salesforce",
      "Alphabet",
      "Amazon",
      "Mainfreight"
    ]
  }
}

// Analyze news for a single company
async function analyzeCompanyNews(
  company: string, 
  model: any, 
  startDate: string, 
  endDate: string,
  currentDate: string
): Promise<any> {
  // System instruction with all the detailed requirements
  const systemInstruction = `You are a specialized Business Intelligence analyst with access to real-time web search.

Your task is to provide comprehensive news analysis for a single company by:
1. Finding direct company news AND industry/market events that could impact them
2. Synthesizing multiple sources into coherent summaries
3. Providing accurate source URLs for all information
4. Analyzing both company-specific and broader market implications

SEARCH REQUIREMENTS:
- Time period: STRICTLY within the provided date range (30 days)
- Direct news categories:
  * Financial results, earnings, revenue, guidance, analyst ratings
  * Mergers, acquisitions, partnerships, investments, divestitures
  * Product launches, innovations, strategic initiatives, R&D developments
  * Leadership changes, organizational restructuring, key hires/departures
  * Regulatory issues, legal developments, compliance matters, lawsuits
  * Market share changes, competitive positioning, customer wins/losses
  * Stock performance, insider trading, shareholder activities

- Indirect/industry news categories:
  * Industry trends, disruptions, and technological shifts
  * Competitor activities, market entries/exits, competitive dynamics
  * Regulatory changes or proposals affecting their sector
  * Economic factors, inflation, interest rates impacting their markets
  * Supply chain disruptions, commodity prices, geopolitical events
  * Consumer behavior changes, demographic shifts
  * Environmental/ESG factors affecting their industry

SOURCE REQUIREMENTS:
- Prioritize: Reuters, Bloomberg, WSJ, Financial Times, CNBC, Forbes, Fortune
- Also use: MarketWatch, Business Insider, The Economist, official company websites
- Industry publications and trade journals specific to the company's sector
- For NZ companies: NZ Herald, Stuff.co.nz, NBR

OUTPUT REQUIREMENTS:
- Synthesize findings into 3-7 comprehensive bullet points
- Each bullet should combine related information from multiple sources
- Explain the significance and potential impact
- Include both opportunities and risks
- Provide context for understanding implications
- List ALL sources used with accurate titles and URLs
- Mark sources as "direct" (mentions company) or "indirect" (industry/market impact)

Return ONLY valid JSON in the exact schema provided.`

  // Simple prompt for the specific company
  const prompt = `Analyze business news for ${company} from ${startDate} to ${endDate}.

Current date: ${currentDate}

Return this JSON structure:
{
  "company_name": "${company}",
  "status": "news_found" or "no_significant_news_found",
  "summary_points": [
    "• Comprehensive bullet point with context and implications"
  ],
  "references": [
    {
      "title": "Article headline",
      "source_name": "Publication",
      "url": "Direct URL",
      "publication_date": "YYYY-MM-DD",
      "relevance": "direct" or "indirect"
    }
  ]
}`

  try {
    logger.info(`Analyzing news for ${company}...`)
    
    let result
    let retries = 0
    const maxRetries = 3
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction,
        })
        break // Success, exit retry loop
      } catch (apiError: any) {
        if (apiError.message?.includes('429') || apiError.message?.includes('quota')) {
          retries++
          if (retries < maxRetries) {
            const waitTime = Math.min(Math.pow(2, retries) * 500, 5000) // Exponential backoff: 1s, 2s, max 5s
            logger.warn(`Rate limit hit for ${company}, waiting ${waitTime}ms before retry ${retries}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          } else {
            throw apiError
          }
        } else {
          throw apiError
        }
      }
    }
    
    if (!result) {
      throw new Error('Failed to get response after retries')
    }
    
    const response = await result.response
    const text = response.text()
    
    // Parse the response
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Remove any BOM or zero-width characters
    cleanedText = cleanedText.replace(/^\uFEFF/, '').replace(/\u200B/g, '')
    
    // Find JSON boundaries
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
    }
    
    // Try to fix common JSON issues
    try {
      // First attempt - parse as is
      const companyData = JSON.parse(cleanedText)
      
      // Validate and clean the data
      if (companyData.references && Array.isArray(companyData.references)) {
        companyData.references = companyData.references.map((ref: any) => ({
          title: ref.title || 'Untitled',
          source_name: ref.source_name || 'Unknown Source',
          url: ref.url || '#',
          publication_date: ref.publication_date || currentDate,
          relevance: ref.relevance || 'direct'
        }))
      }
      
      logger.info(`✓ ${company}: ${companyData.status} (${companyData.summary_points?.length || 0} summaries, ${companyData.references?.length || 0} references)`)
      
      return companyData
    } catch (parseError: any) {
      // Try to extract what we can from the response
      logger.error(`JSON parse error for ${company}:`, parseError.message)
      
      // Attempt to fix common issues
      try {
        // Remove trailing commas
        let fixedText = cleanedText.replace(/,(\s*[}\]])/g, '$1')
        
        // Fix unescaped quotes in JSON values
        // This regex looks for patterns like "value": "text with "quotes" inside"
        fixedText = fixedText.replace(/":\s*"([^"]*(?:"[^"]*)*[^"]*)"/g, (match, value) => {
          // Escape internal quotes
          const escapedValue = value.replace(/(?<!\\)"/g, '\\"')
          return `": "${escapedValue}"`
        })
        
        // Remove any control characters
        fixedText = fixedText.replace(/[\x00-\x1F\x7F]/g, ' ')
        
        // Try parsing the fixed JSON
        const companyData = JSON.parse(fixedText)
        logger.info(`${company}: Fixed JSON and parsed successfully`)
        
        // Ensure required fields exist
        companyData.company_name = companyData.company_name || company
        companyData.status = companyData.status || "no_significant_news_found"
        companyData.summary_points = companyData.summary_points || []
        companyData.references = companyData.references || []
        
        return companyData
      } catch (secondError) {
        logger.error(`Failed to fix JSON for ${company}:`, secondError.message)
        logger.error(`Problematic JSON preview:`, cleanedText.substring(0, 200))
        throw parseError
      }
    }
  } catch (error: any) {
    logger.error(`Error analyzing ${company}:`, error.message)
    // Return a default structure for this company
    return {
      company_name: company,
      status: "no_significant_news_found",
      summary_points: [],
      references: [],
      error: error.message
    }
  }
}

// Extend the timeout for this route
export const maxDuration = 600 // 10 minutes timeout

export async function GET() {
  try {
    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      logger.error('GEMINI_API_KEY environment variable is not configured')
      return NextResponse.json(
        { error: 'News service not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      )
    }

    // Get portfolio companies dynamically
    let portfolioCompanies: string[]
    try {
      portfolioCompanies = await getPortfolioCompanies()
      logger.info(`Successfully fetched ${portfolioCompanies.length} companies`)
    } catch (error) {
      logger.error('Error in getPortfolioCompanies:', error)
      portfolioCompanies = ["Microsoft", "Tesla", "Apple"]
    }

    // Initialize Gemini
    let genAI: GoogleGenerativeAI
    let model: any
    
    try {
      genAI = new GoogleGenerativeAI(apiKey)
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
        },
        tools: [{
          googleSearch: {}
        }]
      })
      logger.info('Gemini API initialized with gemini-2.5-flash-lite and Google Search')
    } catch (error: any) {
      logger.error('Error initializing Gemini:', error)
      
      // Fallback to simpler model
      try {
        genAI = new GoogleGenerativeAI(apiKey)
        model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          tools: [{
            googleSearch: {}
          }]
        })
        logger.info('Using fallback model: gemini-1.5-flash')
      } catch (fallbackError: any) {
        return NextResponse.json(
          { error: 'Failed to initialize AI service.' },
          { status: 500 }
        )
      }
    }

    // Calculate date range
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    logger.info(`Analysis period: ${startDateStr} to ${endDateStr}`)

    // Analyze each company sequentially to avoid rate limits
    const companyResults = []
    
    for (let i = 0; i < portfolioCompanies.length; i++) {
      const company = portfolioCompanies[i]
      logger.info(`Processing ${i + 1}/${portfolioCompanies.length}: ${company}`)
      
      try {
        const result = await analyzeCompanyNews(company, model, startDateStr, endDateStr, currentDate)
        companyResults.push(result)
        
        // Log progress
        const successCount = companyResults.filter(c => c.status === "news_found").length
        const errorCount = companyResults.filter(c => c.error).length
        logger.info(`Progress: ${i + 1}/${portfolioCompanies.length} completed. ${successCount} with news, ${errorCount} with errors`)
        
        // Add a small delay between requests to avoid rate limits (except for last company)
        if (i < portfolioCompanies.length - 1) {
          logger.info('Waiting 500ms before next request...')
          await new Promise(resolve => setTimeout(resolve, 500)) // Reduced to 500ms for faster processing
        }
      } catch (error: any) {
        logger.error(`Failed to analyze ${company}:`, error.message)
        companyResults.push({
          company_name: company,
          status: "no_significant_news_found",
          summary_points: [],
          references: [],
          error: error.message
        })
        
        // Log progress even on error
        const successCount = companyResults.filter(c => c.status === "news_found").length
        const errorCount = companyResults.filter(c => c.error).length
        logger.info(`Progress: ${i + 1}/${portfolioCompanies.length} completed. ${successCount} with news, ${errorCount} with errors`)
      }
    }

    // Aggregate results
    const newsData = {
      report_generated_date: currentDate,
      analysis_period: {
        start_date: startDateStr,
        end_date: endDateStr
      },
      company_news: companyResults
    }

    // Log summary
    const totalCompanies = companyResults.length
    const companiesWithNews = companyResults.filter(c => c.status === "news_found").length
    const companiesWithErrors = companyResults.filter(c => c.error).length
    const totalReferences = companyResults.reduce((sum, c) => sum + (c.references?.length || 0), 0)
    
    logger.info(`Analysis complete: ${totalCompanies} companies, ${companiesWithNews} with news, ${companiesWithErrors} with errors, ${totalReferences} total references`)

    // Cache the response
    return NextResponse.json(newsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })

  } catch (error: any) {
    logger.error('Unexpected error in news API:', error)
    return NextResponse.json(
      { error: `Failed to fetch news data: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}