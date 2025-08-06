import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        configured: false
      }, { status: 500 })
    }
    
    logger.info('Testing Gemini API connection...')
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
      }
    })
    
    // Simple test prompt
    const prompt = "Say 'Hello, I am working!' in exactly 5 words."
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    logger.info('Gemini test successful:', text)
    
    return NextResponse.json({
      success: true,
      configured: true,
      response: text,
      model: "gemini-2.5-flash",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    logger.error('Gemini test failed:', error)
    
    return NextResponse.json({
      error: 'Gemini API test failed',
      message: error.message,
      configured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}