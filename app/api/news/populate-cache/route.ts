import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { newsCache } from '@/lib/news-cache'
import { generatePortfolioData } from '@/lib/portfolioServerData'
import { parseCSVData } from '@/lib/portfolio'
import { downloadTradeDataFromBlob } from '@/lib/blob-utils'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Get unique company names from portfolio data
async function getPortfolioCompanies(): Promise<string[]> {
  try {
    const companies = new Map<string, string>() // Map of company name to symbol
    
    // Get portfolio data directly
    const { holdings, exitedPositions } = await generatePortfolioData()
    
    // Add current holdings
    holdings.forEach(holding => {
      if (holding.name && holding.symbol) {
        companies.set(holding.name, holding.symbol)
      }
    })
    
    // Add exited positions
    exitedPositions.forEach(position => {
      if (position.name && position.symbol) {
        companies.set(position.name, position.symbol)
      }
    })
    
    // Also get raw trade data to ensure we capture all historical companies
    try {
      const csvContent = await downloadTradeDataFromBlob()
      const trades = parseCSVData(csvContent)
      trades.forEach(trade => {
        if (trade.name && trade.code) {
          companies.set(trade.name, trade.code)
        }
      })
    } catch (error) {
      logger.warn('Could not fetch raw trade data for complete company list:', error)
    }
    
    // Convert to array with symbols in parentheses
    const companyList = Array.from(companies.entries()).map(([name, symbol]) => `${name} (${symbol})`)
    logger.info('Found portfolio companies:', companyList)
    
    return companyList
  } catch (error) {
    logger.error('Error fetching portfolio companies:', error)
    throw error
  }
}

// Analyze news for a single company (copied from the API route)
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

IMPORTANT RULES:
- It is better to return news of minor significance than to report 'no_significant_news_found'
- If no direct company news is found, provide relevant industry news that could impact the company
- Always search broadly across company-specific news, competitor activities, and industry trends
- For public companies, use stock ticker symbols when searching financial news sources for more accurate results

SEARCH REQUIREMENTS:
- Time period: Primarily focus on the provided date range (30 days)
- Direct news categories:
  * Financial results, earnings, revenue, guidance, analyst ratings
  * Mergers, acquisitions, partnerships, investments, divestitures
  * Product launches, innovations, strategic initiatives, R&D developments
  * Leadership changes, organizational restructuring, key hires/departures
  * Regulatory issues, legal developments, compliance matters, lawsuits
  * Market share changes, competitive positioning, customer wins/losses
  * Stock performance, insider trading, shareholder activities

- Indirect/industry news categories (use as fallback if direct news is limited):
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
- Include reference numbers in square brackets [1], [2], etc. when citing specific information
- Explain the significance and potential impact
- Include both opportunities and risks
- Provide context for understanding implications
- List ALL sources used with accurate titles and URLs
- Mark sources as "direct" (mentions company) or "indirect" (industry/market impact)

JSON OUTPUT SCHEMA:
You must return ONLY valid JSON in this exact format:
{
  "company_name": "Company Name",
  "status": "news_found" or "no_significant_news_found",
  "summary_points": [
    "• Comprehensive bullet point with context and implications [1][3]"
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
}

Note: Reference numbers in summary_points correspond to the index (starting from 1) of items in the references array.

Remember: Always prefer returning minor news or relevant industry developments over reporting no news found.`

  // Simple prompt for the specific company
  const prompt = `Company: ${company}
Start Date: ${startDate}
End Date: ${endDate}
Current Date: ${currentDate}

Note: If the company name includes a stock ticker in parentheses, use it to ensure you're analyzing the correct company.`

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
        fixedText = fixedText.replace(/":\s*"([^"]*(?:"[^"]*)*[^"]*)"/g, (match, value) => {
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
      } catch (secondError: any) {
        logger.error(`Failed to fix JSON for ${company}:`, secondError.message)
        throw parseError
      }
    }
  } catch (error: any) {
    logger.error(`Error analyzing ${company}:`, error.message)
    
    // Return a default structure when analysis fails
    return {
      company_name: company,
      status: "no_significant_news_found",
      summary_points: [],
      references: [],
      error: error.message
    }
  }
}

export async function POST(request: Request) {
  try {
    // Check for authorization (simple secret-based auth)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.CACHE_POPULATE_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    logger.info('Starting news cache population via API...')
    
    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not configured' },
        { status: 500 }
      )
    }
    
    // Initialize cache
    await newsCache.initialize()
    
    // Get date range
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Check if we should force refresh (optional parameter)
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'
    
    // Get portfolio companies
    const companies = await getPortfolioCompanies()
    logger.info(`Found ${companies.length} companies to analyze`)
    
    // Check how many need updating
    let needsUpdate = 0
    for (const company of companies) {
      const cachedResult = await newsCache.get(company, startDateStr, endDateStr)
      if (!cachedResult || forceRefresh) {
        needsUpdate++
      }
    }
    
    if (needsUpdate === 0 && !forceRefresh) {
      logger.info('All companies have fresh cache, no updates needed')
      return NextResponse.json({
        message: 'All companies have fresh cache',
        companies: companies.length,
        updated: 0,
        stats: await newsCache.getStats()
      })
    }
    
    // Initialize Gemini
    let genAI: GoogleGenerativeAI
    let model: any
    
    try {
      genAI = new GoogleGenerativeAI(apiKey)
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.3,
        },
        tools: [{
          googleSearch: {}
        }]
      })
    } catch (error: any) {
      // Fallback model
      genAI = new GoogleGenerativeAI(apiKey)
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.3,
        },
        tools: [{
          googleSearch: {}
        }]
      })
    }
    
    // Process companies sequentially
    let successCount = 0
    let errorCount = 0
    const errors: { company: string; error: string }[] = []
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i]
      
      try {
        // Check if we already have fresh cache for this company
        if (!forceRefresh) {
          const cachedResult = await newsCache.get(company, startDateStr, endDateStr)
          if (cachedResult) {
            logger.info(`Skipping ${company} - already has fresh cache`)
            continue
          }
        }
        
        logger.info(`Processing ${i + 1}/${companies.length}: ${company}`)
        
        // Analyze the company
        const result = await analyzeCompanyNews(company, model, startDateStr, endDateStr, currentDate)
        
        // Log the result for debugging
        logger.info(`Analysis result for ${company}:`, {
          status: result.status,
          hasError: !!result.error,
          summaryCount: result.summary_points?.length || 0,
          referenceCount: result.references?.length || 0,
          error: result.error
        })
        
        // Only cache successful results with news found
        const shouldCache = result && 
                           result.status === 'news_found' && 
                           !result.error &&
                           result.summary_points && 
                           result.summary_points.length > 0 &&
                           result.references &&
                           result.references.length > 0
        
        if (shouldCache) {
          await newsCache.set(company, startDateStr, endDateStr, result)
          logger.info(`Successfully cached news for ${company}`)
          successCount++
        } else {
          const reasons = []
          if (!result) reasons.push('no result')
          if (result?.status !== 'news_found') reasons.push(`status: ${result?.status}`)
          if (result?.error) reasons.push('has error')
          if (!result?.summary_points?.length) reasons.push('no summaries')
          if (!result?.references?.length) reasons.push('no references')
          logger.warn(`Skipping cache for ${company} - Reasons: ${reasons.join(', ')}`)
        }
        
        // Add delay between companies to avoid rate limits
        if (i < companies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error: any) {
        logger.error(`Error processing ${company}:`, error.message)
        errors.push({ company, error: error.message })
        errorCount++
      }
    }
    
    logger.info(`Cache population completed: ${successCount} successful, ${errorCount} errors`)
    
    // Get cache stats
    const stats = await newsCache.getStats()
    
    return NextResponse.json({
      message: 'Cache population completed',
      companies: companies.length,
      updated: successCount,
      errors: errorCount,
      errorDetails: errors,
      stats
    })
    
  } catch (error: any) {
    logger.error('Error in cache population API:', error)
    return NextResponse.json(
      { error: `Failed to populate cache: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET method to check cache status
export async function GET() {
  try {
    await newsCache.initialize()
    const stats = await newsCache.getStats()
    
    return NextResponse.json({
      message: 'News cache status',
      stats,
      configured: !!process.env.GEMINI_API_KEY
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to get cache status: ${error.message}` },
      { status: 500 }
    )
  }
}