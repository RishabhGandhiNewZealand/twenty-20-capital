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
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      logger.info('Gemini API initialized successfully with gemini-2.5-flash')
    } catch (error: any) {
      logger.error('Error initializing Gemini API with gemini-2.5-flash:', error)
      logger.error('Error name:', error.name)
      logger.error('Error message:', error.message)
      logger.error('Error stack:', error.stack)
      
      // Try with 1.5 flash model as fallback
      try {
        genAI = new GoogleGenerativeAI(apiKey)
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        logger.info('Falling back to gemini-1.5-flash model')
      } catch (fallbackError: any) {
        logger.error('Error with fallback model gemini-1.5-flash:', fallbackError)
        logger.error('Fallback error name:', fallbackError.name)
        logger.error('Fallback error message:', fallbackError.message)
        
        // Try one more fallback with gemini-pro
        try {
          genAI = new GoogleGenerativeAI(apiKey)
          model = genAI.getGenerativeModel({ model: "gemini-pro" })
          logger.info('Falling back to gemini-pro model')
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

    // Construct the prompt with the new stricter version
    const prompt = `Role: A specialized Business Intelligence service. Your task is to process a list of companies and return a structured news analysis.
Your response MUST be a single, valid JSON object. Do not include any explanatory text, Markdown formatting, or any content outside of the final JSON structure. ABSOLUTELY NO HALLUCINATED INFORMATION OR URLs ARE PERMITTED. EVERY PIECE OF DATA MUST BE DIRECTLY VERIFIABLE AND ACCURATE.
INPUT DATA:
Current Date: ${currentDate}
Company List: ${portfolioCompanies.join(',')}
INSTRUCTIONS:

For each company in the Company List, perform a targeted internet search for significant news.
Recency: STRICTLY AND UNCONDITIONALLY limit your search to news published EXACTLY within the 14-day period preceding the Current Date provided (i.e., from ${startDateStr} to ${endDateStr} inclusive). News published outside this precise window, even by one day, MUST BE EXPLICITLY AND IMMEDIATELY EXCLUDED.
Source Reliability: ONLY AND EXCLUSIVELY retrieve news from DEMONSTRABLY VERIFIED, TOP-TIER, HIGHLY REPUTABLE financial news outlets (e.g., Reuters.com, Bloomberg.com, WSJ.com, APNews.com, FT.com, NZHerald.co.nz) and OFFICIAL, DIRECT, VERIFIABLE company press releases found only on their investor relations or official newsroom sections of their primary corporate websites. Any source not explicitly listed or undeniably meeting these stringent criteria (e.g., blogs, forums, aggregated news sites, non-official social media, unverified press release services) MUST BE DISREGARDED IMMEDIATELY.
Content Focus: Identify and analyze ALL high-quality, genuinely relevant, and factually accurate news pertaining to the following categories: financial performance (e.g., published earnings reports, confirmed revenue forecasts, dividend changes), significant M&A activities (e.g., publicly announced acquisitions, confirmed mergers, divestitures), major product launches (e.g., official announcements of new products/services, not rumors or leaks), C-suite leadership changes (e.g., confirmed CEO, CFO, COO appointments or departures), and material regulatory or legal events (e.g., official antitrust investigations, confirmed major lawsuits, enacted policy changes directly impacting company operations). The analysis must include every pertinent article that passes ALL verification checks.
Verification Protocol (Non-Negotiable):

Date Verification: For every potential news item, EXACTLY match the publication date found on the article to the allowed date range (${startDateStr} to ${endDateStr}). Discrepancies, no matter how small, result in exclusion.

Source Verification: Confirm the domain and publisher name DIRECTLY against the list of approved reputable sources.

URL Validation & Accessibility: CRITICALLY, FOR EVERY SINGLE URL, PERFORM A DIRECT ACCESS ATTEMPT TO ENSURE IT IS LIVE, ACCESSIBLE, AND LEADS IMMEDIATELY TO THE SPECIFIC REPORTED ARTICLE. If the URL is broken, leads to a different article, or is inaccessible, the news item MUST BE EXCLUDED.

Content Accuracy Check: Read the article to ensure the summary you generate is a direct, factual, and concise representation of the article's content, with no inference, speculation, or added information.
NO NEWS ITEM IS TO BE INCLUDED UNLESS IT HAS PASSED ALL FOUR VERIFICATION STEPS WITH 100% CONFIDENCE.
Output Generation: Populate the JSON object strictly according to the schema defined below.
REQUIRED JSON OUTPUT SCHEMA:
{
"report_generated_date": "YYYY-MM-DD",
"company_news": [
{
"company_name": "String",
"status": "String ('news_found' or 'no_significant_news_found')",
"news_items": [
{
"summary": "String (A 1-2 sentence, factual, and direct summary of the news event, derived ONLY from the article content.)",
"source_name": "String (The exact name of the publication as it appears on the article.)",
"url": "String (The verified, direct, and accessible URL to the article.)",
"publication_date": "String (Format as YYYY-MM-DD, exactly as verified on the article.)"
}
]
}
]
}
SCHEMA LOGIC:

report_generated_date: The Current Date provided in the input.
company_news: An array of objects, where each object represents a company from the input list.
company_name: The name of the company being reported on.
status:
Set to "news_found" if you find 1 or more relevant articles that have passed EVERY SINGLE verification step within the STRICT timeframe and from VERIFIED sources.
Set to "no_significant_news_found" if no relevant articles are found that meet ALL stringent criteria and pass ALL verification steps.
news_items:
An array containing ALL important news item objects for the company that have passed ALL verification steps and meet the quality and relevance criteria. This array can contain any number of items (0 or more).
If status is "no_significant_news_found", this MUST be an empty array [].`

    // Call Gemini API
    let result: any
    let text: string
    
    try {
      logger.info('Calling Gemini API...')
      logger.info('Using model:', model.model || 'unknown')
      logger.info('Prompt length:', prompt.length)
      
      result = await model.generateContent(prompt)
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
      
      // Log a sample of the data for debugging
      if (newsData.company_news.length > 0) {
        const sampleCompany = newsData.company_news[0]
        logger.info('Sample company news:', {
          company: sampleCompany.company_name,
          status: sampleCompany.status,
          newsCount: sampleCompany.news_items.length
        })
      }

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