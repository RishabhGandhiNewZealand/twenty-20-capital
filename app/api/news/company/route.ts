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
  const systemInstruction = `You are a Business Intelligence analyst with web search access, analyzing company news and market developments.

TASK: Search for and synthesize news about the specified company within the given date range (typically last 30 days).

SEARCH STRATEGY:
1. Start with direct company news (earnings, products, leadership, partnerships, etc.)
2. If direct news is limited, expand to relevant industry/market developments:
   - Competitor activities and market dynamics
   - Regulatory changes affecting their sector
   - Economic trends impacting their industry
   - Technology shifts in their market
   - Supply chain or geopolitical events affecting operations

SOURCES TO PRIORITIZE:
- Major outlets: Reuters, Bloomberg, WSJ, Financial Times, CNBC, Forbes
- Industry publications relevant to the company's sector
- Company press releases and investor relations

OUTPUT FORMAT:
- Provide 3-7 bullet points summarizing key developments
- Each point should explain the significance and potential impact
- Include source references with accurate titles and URLs
- Return valid JSON matching the exact schema provided

For major established companies, you should typically find relevant developments within a 30-day window by searching broadly across company-specific and industry news.`

  // Simple prompt for the specific company
  const prompt = `Analyze business news for ${company} from ${startDate} to ${endDate}.

Current date: ${currentDate}

Search thoroughly for both direct company news and relevant industry developments that could impact ${company}.

IMPORTANT: Before returning "no_significant_news_found", ensure you've searched for:
- Direct company news (earnings, products, partnerships, leadership changes)
- Industry trends and competitor activities
- Market conditions affecting their sector
- Regulatory or economic developments impacting their business

Return JSON with this structure:
{
  "company_name": "${company}",
  "status": "news_found" or "no_significant_news_found",
  "summary_points": [
    "• Bullet point describing development with context and implications"
  ],
  "references": [
    {
      "title": "Article headline",
      "source_name": "Publication name",
      "url": "Direct URL to article",
      "publication_date": "YYYY-MM-DD",
      "relevance": "direct" or "indirect"
    }
  ]
}

Note: For established companies, significant developments typically occur within any 30-day period when searching across company news, industry trends, and market conditions.`

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
      
      // Validate the response - if status is news_found but no actual content, fix it
      if (companyData.status === 'news_found' && 
          (!companyData.summary_points || companyData.summary_points.length === 0)) {
        console.warn(`[${company}] Status is 'news_found' but no summary points provided. Correcting status.`)
        companyData.status = 'no_significant_news_found'
      }
      
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
        
        // Validate the response - if status is news_found but no actual content, fix it
        if (companyData.status === 'news_found' && 
            (!companyData.summary_points || companyData.summary_points.length === 0)) {
          console.warn(`[${company}] Fixed JSON has 'news_found' but no summary points. Correcting status.`)
          companyData.status = 'no_significant_news_found'
        }
        
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