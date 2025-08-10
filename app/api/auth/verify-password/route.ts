import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Get the admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not configured')
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 500 }
      )
    }
    
    // Check if the password matches
    const isValid = password === adminPassword
    
    return NextResponse.json({ success: isValid })
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify password' },
      { status: 500 }
    )
  }
}