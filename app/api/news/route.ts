import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Portfolio companies list - both current and past
const PORTFOLIO_COMPANIES = [
  "Microsoft",
  "Tesla", 
  "Fonterra Co-operative Group",
  "Fletcher Building",
  "Meta Platforms",
  "Salesforce",
  "Alphabet",
  "Amazon",
  "UnitedHealth Group",
  "Mainfreight",
  "Berkshire Hathaway",
  "Apple"
]

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

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]

    // Construct the prompt
    const prompt = `You are an AI model that functions as a specialized Business Intelligence service. Your task is to process a list of companies and return a structured news analysis.

Your response MUST be a single, valid JSON object. Do not include any explanatory text, Markdown formatting (\`\`\`json), or any content outside of the final JSON structure.

INPUT DATA:

Current Date: ${currentDate}

Company List: ${JSON.stringify(PORTFOLIO_COMPANIES)}

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    try {
      // Clean the response - remove any markdown formatting if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const newsData = JSON.parse(cleanedText)

      // Validate the response structure
      if (!newsData.report_generated_date || !Array.isArray(newsData.company_news)) {
        throw new Error('Invalid response structure from Gemini')
      }

      // Cache the response for 1 hour
      return NextResponse.json(newsData, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      })
    } catch (parseError) {
      logger.error('Error parsing Gemini response:', parseError)
      logger.error('Raw response:', text)
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