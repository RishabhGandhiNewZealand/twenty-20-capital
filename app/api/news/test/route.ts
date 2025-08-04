import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not configured',
        message: 'Please set GEMINI_API_KEY in your environment variables'
      })
    }

    // Try to initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try different models
    const models = ['gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    const results: any = {}
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say "Hello, I am working!" in JSON format with a field called "message".')
        const response = await result.response
        const text = response.text()
        results[modelName] = {
          success: true,
          response: text.substring(0, 100) + '...'
        }
      } catch (error: any) {
        results[modelName] = {
          success: false,
          error: error.message
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      apiKeyLength: apiKey.length,
      models: results
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}