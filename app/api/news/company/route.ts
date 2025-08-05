import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { newsCache } from '@/lib/news-cache'

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
}

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
    
    // Log raw response for debugging
    console.log(`[${company}] Raw LLM response length: ${text.length} characters`)
    if (text.length < 100) {
      console.log(`[${company}] Full raw response:`, text)
    } else {
      console.log(`[${company}] Raw response preview (first 200 chars):`, text.substring(0, 200))
    }
    
    // Parse the response
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Remove any BOM or zero-width characters
    cleanedText = cleanedText.replace(/^\uFEFF/, '').replace(/\u200B/g, '')
    
    // Log cleaned text for debugging
    console.log(`[${company}] Cleaned text length: ${cleanedText.length} characters`)
    
    // Find JSON boundaries
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      console.log(`[${company}] JSON boundaries found - start: ${jsonStart}, end: ${jsonEnd}`)
    } else {
      console.error(`[${company}] WARNING: Could not find JSON boundaries. jsonStart: ${jsonStart}, jsonEnd: ${jsonEnd}`)
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
      console.error(`[${company}] JSON parse error details:`, {
        errorMessage: parseError.message,
        errorStack: parseError.stack,
        jsonPreview: cleanedText.substring(0, 500),
        jsonLength: cleanedText.length
      })
      
      // Attempt to fix common issues
      try {
        console.log(`[${company}] Attempting to fix JSON...`)
        
        // Remove trailing commas
        let fixedText = cleanedText.replace(/,(\s*[}\]])/g, '$1')
        console.log(`[${company}] Removed trailing commas`)
        
        // Fix unescaped quotes in JSON values
        fixedText = fixedText.replace(/":\s*"([^"]*(?:"[^"]*)*[^"]*)"/g, (match, value) => {
          const escapedValue = value.replace(/(?<!\\)"/g, '\\"')
          return `": "${escapedValue}"`
        })
        console.log(`[${company}] Fixed unescaped quotes`)
        
        // Remove any control characters
        fixedText = fixedText.replace(/[\x00-\x1F\x7F]/g, ' ')
        console.log(`[${company}] Removed control characters`)
        
        // Log the fixed text for debugging
        console.log(`[${company}] Fixed JSON preview (first 200 chars):`, fixedText.substring(0, 200))
        
        // Try parsing the fixed JSON
        const companyData = JSON.parse(fixedText)
        logger.info(`${company}: Fixed JSON and parsed successfully`)
        console.log(`[${company}] Successfully parsed fixed JSON with ${companyData.summary_points?.length || 0} summaries`)
        
        // Ensure required fields exist
        companyData.company_name = companyData.company_name || company
        companyData.status = companyData.status || "no_significant_news_found"
        companyData.summary_points = companyData.summary_points || []
        companyData.references = companyData.references || []
        
        return companyData
      } catch (secondError: any) {
        logger.error(`Failed to fix JSON for ${company}:`, secondError.message)
        logger.error(`Problematic JSON preview:`, cleanedText.substring(0, 200))
        console.error(`[${company}] Failed to fix JSON:`, {
          secondErrorMessage: secondError.message,
          secondErrorStack: secondError.stack,
          fullCleanedText: cleanedText
        })
        throw parseError
      }
    }
  } catch (error: any) {
    logger.error(`Error analyzing ${company}:`, error.message)
    console.error(`[${company}] Full error in analyzeCompanyNews:`, {
      errorMessage: error.message,
      errorStack: error.stack
    })
    
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company parameter is required' },
        { status: 400 }
      )
    }
    
    // Calculate date range
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Initialize cache
    await newsCache.initialize()
    
    // Check cache first - the cache service will only return fresh data (end date within 7 days)
    const cachedResult = await newsCache.get(company, startDateStr, endDateStr)
    if (cachedResult) {
      logger.info(`Returning fresh cached result for ${company}`)
      return NextResponse.json(cachedResult)
    }
    
    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'News service not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      )
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
    } catch (error: any) {
      // Fallback model
      genAI = new GoogleGenerativeAI(apiKey)
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{
          googleSearch: {}
        }]
      })
    }

    // Analyze the company
    const result = await analyzeCompanyNews(company, model, startDateStr, endDateStr, currentDate)
    
    // Only cache successful results with news found
    const shouldCache = result && 
                       result.status === 'news_found' && 
                       !result.error &&
                       result.summary_points && 
                       result.summary_points.length > 0 &&
                       result.references &&
                       result.references.length > 0
    
    if (shouldCache) {
      try {
        logger.info(`Attempting to cache result for ${company} (status: ${result.status}, summaries: ${result.summary_points.length}, refs: ${result.references.length})`)
        await newsCache.set(company, startDateStr, endDateStr, result)
        logger.info(`Successfully cached result for ${company}`)
      } catch (cacheError: any) {
        logger.error(`Failed to cache result for ${company}:`, cacheError)
        // Continue even if caching fails - don't break the user experience
      }
    } else {
      const reasons = []
      if (!result) reasons.push('no result')
      if (result?.status !== 'news_found') reasons.push(`status: ${result?.status}`)
      if (result?.error) reasons.push('has error')
      if (!result?.summary_points?.length) reasons.push('no summaries')
      if (!result?.references?.length) reasons.push('no references')
      
      logger.info(`Skipping cache for ${company} - Reasons: ${reasons.join(', ')}`)
    }
    
    return NextResponse.json(result)

  } catch (error: any) {
    logger.error('Error in single company analysis:', error)
    return NextResponse.json(
      { error: `Failed to analyze company: ${error.message}` },
      { status: 500 }
    )
  }
}