import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = adminEmail && email === adminEmail
    
    logger.info(`Admin check for ${email}: ${isAdmin}`)
    
    return NextResponse.json({ isAdmin })
  } catch (error) {
    logger.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}