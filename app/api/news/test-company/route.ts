import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company') || 'Microsoft'
    
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ googleSearch: {} }]
    })
    
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    
    // Minimal system instruction
    const systemInstruction = `You are a business analyst. Find recent news for the company and return JSON only.`
    
    // Simple prompt
    const prompt = `Find news for ${company} from the last 30 days.
Return this JSON:
{
  "company_name": "${company}",
  "status": "news_found" or "no_significant_news_found",
  "summary_points": ["• Summary of news"],
  "references": [{"title": "Title", "source_name": "Source", "url": "URL", "publication_date": "YYYY-MM-DD", "relevance": "direct"}]
}`

    logger.info(`Testing news analysis for: ${company}`)
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction,
    })
    
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON
    let newsData
    try {
      let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      }
      newsData = JSON.parse(cleanedText)
    } catch (e) {
      newsData = { error: 'Failed to parse response', raw: text }
    }
    
    return NextResponse.json({
      success: true,
      company,
      promptLength: prompt.length,
      responseLength: text.length,
      data: newsData
    })
    
  } catch (error: any) {
    logger.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}