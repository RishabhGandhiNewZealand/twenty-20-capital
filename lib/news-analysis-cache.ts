import { unstable_cache } from 'next/cache'
import { NewsCache } from './news-cache'
import { logger } from './logger'
import { CACHE_DURATIONS, CACHE_TAGS } from './cache-config'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface CachedNewsData {
  company_name: string
  status: 'news_found' | 'no_significant_news_found'
  summary_points: string[]
  references: Array<{
    title: string
    source_name: string
    url: string
    publication_date: string
    relevance: 'direct' | 'indirect'
  }>
  error?: string
}

interface NewsAnalysisResult {
  report_generated_date: string
  analysis_period: {
    start_date: string
    end_date: string
  }
  company_news: CachedNewsData[]
}

/**
 * Check if cached news data is still fresh (less than 1 month old)
 */
function isCacheFresh(cacheCreatedAt: Date): boolean {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return cacheCreatedAt > oneMonthAgo
}

/**
 * Analyze news for a single company using Gemini API
 * This function will check the database cache first
 */
async function analyzeCompanyNewsWithCache(
  company: string,
  model: any,
  startDate: string,
  endDate: string,
  currentDate: string
): Promise<CachedNewsData> {
  const newsCache = NewsCache.getInstance()
  
  // Try to get from database cache first
  try {
    const cached = await newsCache.get(company, startDate, endDate)
    if (cached) {
      // Check if the cache is fresh (less than 1 month old)
      // The NewsCache.get() method returns entries, we need to check the created date
      // For now, we'll check if we have cached data and trust the NewsCache logic
      logger.info(`Found cached news for ${company}`)
      
      // Get the cache entry details to check age
      const sql = (await import('./db')).getDb()
      const cacheEntries = await sql`
        SELECT created_at FROM application.news_cache 
        WHERE company_name = ${company}
        AND start_date = ${startDate}
        AND end_date = ${endDate}
        ORDER BY created_at DESC
        LIMIT 1
      `
      
      if (cacheEntries.length > 0) {
        const cacheAge = cacheEntries[0].created_at
        if (isCacheFresh(cacheAge)) {
          logger.info(`Cache for ${company} is fresh (created: ${cacheAge.toISOString()})`)
          return cached
        } else {
          logger.info(`Cache for ${company} is stale (created: ${cacheAge.toISOString()}), will refresh`)
        }
      }
    }
  } catch (error) {
    logger.warn(`Failed to check cache for ${company}:`, error)
  }

  // If not in cache or cache is stale (>1 month old), analyze with Gemini
  logger.info(`Analyzing news for ${company} with Gemini API...`)
  
  const systemInstruction = `You are a financial news analyst specializing in portfolio companies. 
Your task is to search for and synthesize recent news about companies using Google Search.

IMPORTANT SEARCH GUIDELINES:
- Cast a WIDE NET when searching - look for company news across multiple angles
- Search for the company name WITH and WITHOUT stock ticker
- Include searches for major products, services, subsidiaries
- Look for industry trends that would affect the company
- Search for key executives, major partnerships, competitors
- Include regional variations (e.g., "Microsoft Australia" for regional news)

SEARCH EXAMPLES for comprehensive coverage:
- Direct: "[Company] news", "[Company] announcement", "[Company] earnings"
- Products: "[Company] [major product] launch", "[Company] new service"
- Leadership: "[Company] CEO", "[Company] management changes"
- Financial: "[Company] stock", "[Company] revenue", "[Company] forecast"
- Strategic: "[Company] acquisition", "[Company] partnership", "[Company] expansion"
- Industry: "[Industry] trends 2024", "[Sector] outlook", "[Industry] challenges"
- Competitive: "[Company] vs [competitor]", "[Industry] market share"

FOCUS AREAS:
- Financial performance, earnings reports, guidance changes
- Product launches, updates, discontinuations
- Strategic initiatives, acquisitions, partnerships, expansions
- Leadership changes, organizational restructuring
- Market share changes, competitive positioning
- Regulatory issues, legal matters, compliance
- Technology developments, R&D breakthroughs
- ESG initiatives, sustainability efforts
- Major customer wins/losses
- Industry trends affecting the company

INDIRECT NEWS TO CAPTURE:
- Industry-wide developments that impact the company
- Competitor activities, market entries/exits, competitive dynamics
- Regulatory changes or proposals affecting their sector
- Economic factors, inflation, interest rates impacting their markets
- Supply chain disruptions, commodity prices, geopolitical events
- Consumer behavior changes, demographic shifts
- Environmental/ESG factors affecting their industry

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
    let result
    let retries = 0
    const maxRetries = 3
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction,
        })
        break
      } catch (apiError: any) {
        if (apiError.message?.includes('429') || apiError.message?.includes('quota')) {
          retries++
          if (retries < maxRetries) {
            const waitTime = Math.min(Math.pow(2, retries) * 500, 5000)
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
    cleanedText = cleanedText.replace(/^\uFEFF/, '').replace(/\u200B/g, '')
    
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
    }
    
    const companyData = JSON.parse(cleanedText)
    
    // Ensure required fields
    companyData.company_name = companyData.company_name || company
    companyData.status = companyData.status || "no_significant_news_found"
    companyData.summary_points = companyData.summary_points || []
    companyData.references = companyData.references || []
    
    // Save to database cache
    try {
      await newsCache.set(company, startDate, endDate, companyData)
      logger.info(`Cached news analysis for ${company}`)
    } catch (cacheError) {
      logger.warn(`Failed to cache news for ${company}:`, cacheError)
    }
    
    return companyData
  } catch (error: any) {
    logger.error(`Error analyzing ${company}:`, error.message)
    return {
      company_name: company,
      status: "no_significant_news_found",
      summary_points: [],
      references: [],
      error: error.message
    }
  }
}

/**
 * Analyze news for all portfolio companies
 * This is the main function that will be cached by Next.js
 */
async function analyzeAllCompaniesNews(
  companies: string[],
  startDate: string,
  endDate: string,
  currentDate: string,
  apiKey: string
): Promise<NewsAnalysisResult> {
  // Initialize news cache
  const newsCache = NewsCache.getInstance()
  try {
    await newsCache.initialize()
  } catch (error) {
    logger.warn('Failed to initialize news cache, continuing without DB cache:', error)
  }

  // Initialize Gemini
  let model: any
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
      },
      tools: [{
        googleSearch: {}
      }]
    })
    logger.info('Gemini API initialized with gemini-2.0-flash-exp and Google Search')
  } catch (error: any) {
    logger.error('Error initializing Gemini:', error)
    
    // Fallback to simpler model
    const genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{
        googleSearch: {}
      }]
    })
    logger.info('Using fallback model: gemini-1.5-flash')
  }

  // Analyze each company
  const companyResults: CachedNewsData[] = []
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    logger.info(`Processing ${i + 1}/${companies.length}: ${company}`)
    
    try {
      const result = await analyzeCompanyNewsWithCache(
        company,
        model,
        startDate,
        endDate,
        currentDate
      )
      companyResults.push(result)
      
      // Log progress
      const successCount = companyResults.filter(c => c.status === "news_found").length
      const errorCount = companyResults.filter(c => c.error).length
      logger.info(`Progress: ${i + 1}/${companies.length} completed. ${successCount} with news, ${errorCount} with errors`)
      
      // Add delay between requests to avoid rate limits
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
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
    }
  }

  // Log summary
  const totalCompanies = companyResults.length
  const companiesWithNews = companyResults.filter(c => c.status === "news_found").length
  const companiesWithErrors = companyResults.filter(c => c.error).length
  const totalReferences = companyResults.reduce((sum, c) => sum + (c.references?.length || 0), 0)
  
  logger.info(`Analysis complete: ${totalCompanies} companies, ${companiesWithNews} with news, ${companiesWithErrors} with errors, ${totalReferences} total references`)

  return {
    report_generated_date: currentDate,
    analysis_period: {
      start_date: startDate,
      end_date: endDate
    },
    company_news: companyResults
  }
}

/**
 * Cached version of analyzeAllCompaniesNews
 * This caches the entire news analysis result in memory
 */
export const getCachedNewsAnalysis = unstable_cache(
  analyzeAllCompaniesNews,
  [CACHE_TAGS.NEWS],
  {
    revalidate: CACHE_DURATIONS.NEWS_ANALYSIS,
    tags: [CACHE_TAGS.NEWS]
  }
)