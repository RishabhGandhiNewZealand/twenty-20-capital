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

    // Get portfolio companies dynamically
    const portfolioCompanies = await getPortfolioCompanies()
    logger.info(`Fetching news for ${portfolioCompanies.length} companies`)

    // Initialize Gemini with 2.0 Flash model
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]

    // Construct the prompt
    const prompt = `You are an AI model that functions as a specialized Business Intelligence service. Your task is to process a list of companies and return a structured news analysis.

Your response MUST be a single, valid JSON object. Do not include any explanatory text, Markdown formatting (\`\`\`json), or any content outside of the final JSON structure.

INPUT DATA:

Current Date: ${currentDate}

Company List: ${JSON.stringify(portfolioCompanies)}

INSTRUCTIONS:

For each company in the Company List, perform a targeted internet search for significant news.

Recency: Limit your search to news published within 14 days prior to the Current Date provided.

Source Reliability: Prioritize reputable financial news outlets (e.g., Reuters, Bloomberg, Associated Press) and official company press releases from their investor relations websites.

Content Focus: Extract news related to financial performance, M&A, major product launches, C-suite leadership changes, and significant regulatory or legal events.

Output Generation: Populate the JSON object according to the schema defined below.

REQUIRED JSON OUTPUT SCHEMA:

{
  "report_generated_date": "YYYY-MM-DD",
  "company_news": [
    {
      "company_name": "String",
      "status": "String ('news_found' or 'no_significant_news_found')",
      "news_items": [
        {
          "summary": "String (A 1-2 sentence summary of the news event.)",
          "source_name": "String (The name of the publication.)",
          "url": "String (A direct URL to the article.)",
          "publication_date": "String (Format as YYYY-MM-DD.)"
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

Set to "news_found" if you find 1 or more relevant articles within the timeframe.

Set to "no_significant_news_found" if no relevant articles are found.

news_items:

An array containing 2-3 of the most important news item objects for the company.

If status is "no_significant_news_found", this MUST be an empty array [].`

    // Call Gemini API
    logger.info('Calling Gemini API with model: gemini-2.0-flash-exp')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    logger.info('Gemini API response received, length:', text.length)

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
    } catch (parseError) {
      logger.error('Error parsing Gemini response:', parseError)
      logger.error('Raw response preview:', text.substring(0, 500))
      logger.error('Raw response end:', text.substring(Math.max(0, text.length - 500)))
      return NextResponse.json(
        { error: 'Failed to parse news data from AI service' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error fetching news from Gemini:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news data' },
      { status: 500 }
    )
  }
}