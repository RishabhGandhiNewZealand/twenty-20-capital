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
    
    // Calculate date range for the prompt - 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Yesterday

    // System instruction - defines the AI's role and behavior
    const systemInstruction = `You are a specialized Business Intelligence analyst with access to real-time web search.
Your role is to provide comprehensive news analysis for companies by:
1. Finding direct company news AND industry/market events that could impact them
2. Synthesizing multiple sources into coherent summaries
3. Providing accurate source URLs for all information
4. Analyzing both company-specific and broader market implications
5. Returning responses in valid JSON format only`

    // User prompt - the specific task
    const prompt = `Analyze business news for these companies from the last 30 days (${startDateStr} to ${endDateStr}):
${portfolioCompanies.join(', ')}

For EACH company:
1. Search for direct company news about:
   - Financial results, earnings, revenue, guidance
   - Mergers, acquisitions, partnerships, investments
   - Product launches, innovations, strategic initiatives
   - Leadership changes, organizational restructuring
   - Regulatory issues, legal developments, compliance matters
   - Market share changes, competitive positioning

2. ALSO search for indirect/industry news that could impact the company:
   - Industry trends and disruptions
   - Competitor activities and market dynamics
   - Regulatory changes affecting their sector
   - Economic factors impacting their markets
   - Technology shifts in their industry
   - Supply chain or geopolitical events affecting their business

3. Synthesize all findings into comprehensive bullet points that:
   - Combine related information from multiple sources
   - Highlight the most significant developments
   - Explain potential impacts on the company
   - Provide context for understanding implications

Use reputable sources: Reuters, Bloomberg, WSJ, Financial Times, CNBC, Forbes, official company websites, industry publications.

Return this JSON structure:
{
  "report_generated_date": "${currentDate}",
  "analysis_period": {
    "start_date": "${startDateStr}",
    "end_date": "${endDateStr}"
  },
  "company_news": [
    {
      "company_name": "Company Name",
      "status": "news_found" or "no_significant_news_found",
      "summary_points": [
        "• Comprehensive bullet point summarizing a key development or trend",
        "• Another significant finding with context and implications",
        "• Industry development that could impact the company"
      ],
      "references": [
        {
          "title": "Article headline or description",
          "source_name": "Publication name",
          "url": "Direct URL to article",
          "publication_date": "YYYY-MM-DD",
          "relevance": "direct" or "indirect"
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
      logger.info('Analysis period: 30 days')
      
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
        const summaryCount = company.summary_points?.length || 0
        const referenceCount = company.references?.length || 0
        logger.info(`- ${company.company_name}: ${company.status} (${summaryCount} summaries, ${referenceCount} references)`)
      })
      
      // Count total references
      const totalReferences = newsData.company_news.reduce((sum: number, company: any) => 
        sum + (company.references?.length || 0), 0
      )
      logger.info(`Total references found: ${totalReferences}`)

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