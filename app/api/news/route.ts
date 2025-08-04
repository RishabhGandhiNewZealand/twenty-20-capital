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

    logger.info('GEMINI_API_KEY is configured, length:', apiKey.length)

    // Get portfolio companies dynamically
    let portfolioCompanies: string[]
    try {
      portfolioCompanies = await getPortfolioCompanies()
      logger.info(`Successfully fetched ${portfolioCompanies.length} companies`)
    } catch (error) {
      logger.error('Error in getPortfolioCompanies:', error)
      // Use fallback list
      portfolioCompanies = [
        "Microsoft",
        "Tesla", 
        "Fonterra Co-operative Group",
        "Fletcher Building"
      ]
    }

    // Initialize Gemini with 2.5 Flash model
    let genAI: GoogleGenerativeAI
    let model: any
    
    try {
      genAI = new GoogleGenerativeAI(apiKey)
      // Using gemini-2.5-flash as requested
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.1, // Lower temperature for more factual responses
          topK: 40,
          topP: 0.95,
        },
        tools: [{
          googleSearch: {} // Enable Google Search grounding
        }]
      })
      logger.info('Gemini API initialized successfully with gemini-2.5-flash and Google Search')
    } catch (error: any) {
      logger.error('Error initializing Gemini API with gemini-2.5-flash:', error)
      logger.error('Error name:', error.name)
      logger.error('Error message:', error.message)
      logger.error('Error stack:', error.stack)
      
      // Try with 1.5 flash model as fallback
      try {
        genAI = new GoogleGenerativeAI(apiKey)
        model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          tools: [{
            googleSearch: {} // Enable Google Search grounding
          }]
        })
        logger.info('Falling back to gemini-1.5-flash model with Google Search')
      } catch (fallbackError: any) {
        logger.error('Error with fallback model gemini-1.5-flash:', fallbackError)
        logger.error('Fallback error name:', fallbackError.name)
        logger.error('Fallback error message:', fallbackError.message)
        
        // Try one more fallback with gemini-pro
        try {
          genAI = new GoogleGenerativeAI(apiKey)
          model = genAI.getGenerativeModel({ model: "gemini-pro" })
          logger.info('Falling back to gemini-pro model without Google Search')
        } catch (finalError: any) {
          logger.error('Error with final fallback model gemini-pro:', finalError)
          return NextResponse.json(
            { error: 'Failed to initialize AI service. No compatible model found. Please check your API key permissions.' },
            { status: 500 }
          )
        }
      }
    }

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Calculate date range for the prompt
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 14)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Yesterday

    // System instruction - defines the AI's role and behavior
    const systemInstruction = `You are a specialized Business Intelligence analyst with access to real-time web search.
Your role is to find and analyze recent business news for companies.
You must:
1. Use Google Search to find real, current news articles
2. Only report factual information from reputable sources
3. Provide accurate URLs that link to actual articles
4. Focus on significant business events only
5. Return responses in valid JSON format only`

    // User prompt - the specific task
    const prompt = `Search for business news for these companies from the last 14 days (${startDateStr} to ${endDateStr}):
${portfolioCompanies.join(', ')}

For each company, find news about:
- Financial results (earnings, revenue, guidance)
- Mergers, acquisitions, partnerships
- Product launches or major updates
- Leadership changes (CEO, CFO, etc.)
- Regulatory or legal developments
- Strategic business decisions

Use reputable sources like Reuters, Bloomberg, WSJ, Financial Times, CNBC, Forbes, official company websites.

Return ONLY this JSON structure:
{
  "report_generated_date": "${currentDate}",
  "company_news": [
    {
      "company_name": "Company Name",
      "status": "news_found" or "no_significant_news_found",
      "news_items": [
        {
          "summary": "1-2 sentence factual summary",
          "source_name": "Publication name",
          "url": "Direct URL to article",
          "publication_date": "YYYY-MM-DD"
        }
      ]
    }
  ]
}`

    // Call Gemini API with system instruction
    let result: any
    let text: string
    
    try {
      logger.info('Calling Gemini API with Google Search grounding...')
      logger.info('Using model:', model.model || 'unknown')
      logger.info('Prompt length:', prompt.length)
      
      // Generate content with system instruction
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction,
      })
      
      const response = await result.response
      text = response.text()
      logger.info('Gemini API response received, length:', text.length)
    } catch (apiError: any) {
      logger.error('Error calling Gemini API:', apiError)
      logger.error('Error name:', apiError.name)
      logger.error('Error message:', apiError.message)
      logger.error('Error stack:', apiError.stack)
      logger.error('Full error object:', JSON.stringify(apiError, null, 2))
      
      // Check for specific error types
      if (apiError.message?.includes('API key') || apiError.message?.includes('API_KEY')) {
        return NextResponse.json(
          { 
            error: 'Invalid API key. Please check your GEMINI_API_KEY.',
            details: apiError.message 
          },
          { status: 500 }
        )
      } else if (apiError.message?.includes('model') || apiError.message?.includes('Model')) {
        return NextResponse.json(
          { 
            error: 'Model not available. The Gemini model may not be accessible with your API key.',
            details: apiError.message,
            modelUsed: model.model || 'unknown'
          },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { 
            error: `AI service error: ${apiError.message || 'Unknown error'}`,
            details: apiError.message,
            errorType: apiError.name
          },
          { status: 500 }
        )
      }
    }

    // Parse the JSON response
    try {
      // Clean the response - remove any markdown formatting if present
      let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Additional cleaning - sometimes the model adds extra text before or after JSON
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      }
      
      const newsData = JSON.parse(cleanedText)

      // Validate the response structure
      if (!newsData.report_generated_date || !Array.isArray(newsData.company_news)) {
        throw new Error('Invalid response structure from Gemini')
      }

      logger.info(`Successfully parsed news data for ${newsData.company_news.length} companies`)
      
      // Log detailed debugging information
      logger.info('News data summary:')
      newsData.company_news.forEach((company: any) => {
        logger.info(`- ${company.company_name}: ${company.status} (${company.news_items.length} items)`)
        if (company.news_items.length > 0) {
          logger.info(`  First item: ${company.news_items[0].source_name} - ${company.news_items[0].publication_date}`)
        }
      })
      
      // Count total news items
      const totalNewsItems = newsData.company_news.reduce((sum: number, company: any) => 
        sum + company.news_items.length, 0
      )
      logger.info(`Total news items found: ${totalNewsItems}`)

      // Cache the response for 1 hour
      return NextResponse.json(newsData, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      })
    } catch (parseError: any) {
      logger.error('Error parsing Gemini response:', parseError)
      logger.error('Raw response preview:', text?.substring(0, 500) || 'No response text')
      logger.error('Raw response end:', text?.substring(Math.max(0, text.length - 500)) || 'No response text')
      return NextResponse.json(
        { error: 'Failed to parse news data from AI service' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('Unexpected error in news API:', error)
    logger.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: `Failed to fetch news data: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}