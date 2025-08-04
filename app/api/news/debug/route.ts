import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Very simple prompt for debugging
    const prompt = `Find recent news (last 14 days before ${currentDate}) for these companies: Microsoft, Tesla, Apple.

Return ONLY a JSON object in this exact format:
{
  "report_generated_date": "${currentDate}",
  "company_news": [
    {
      "company_name": "Company Name",
      "status": "news_found" or "no_significant_news_found",
      "news_items": [
        {
          "summary": "Brief summary",
          "source_name": "Source",
          "url": "https://example.com",
          "publication_date": "YYYY-MM-DD"
        }
      ]
    }
  ]
}

Include any business news you can find from major news sources. If no news, set status to "no_significant_news_found" and news_items to [].`

    logger.info('Debug: Calling Gemini with simple prompt')
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    logger.info('Debug: Response length:', text.length)
    logger.info('Debug: Raw response preview:', text.substring(0, 200))
    
    // Clean and parse
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
    }
    
    const newsData = JSON.parse(cleanedText)
    
    return NextResponse.json({
      success: true,
      debug: true,
      promptLength: prompt.length,
      responseLength: text.length,
      data: newsData
    })
    
  } catch (error: any) {
    logger.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}