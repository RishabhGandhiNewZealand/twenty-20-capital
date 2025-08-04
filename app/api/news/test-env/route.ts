import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasEdgeConfig: !!process.env.EDGE_CONFIG,
    hasVercelApiToken: !!process.env.VERCEL_API_TOKEN,
    hasVercelTeamId: !!process.env.VERCEL_TEAM_ID,
    hasTeamIdVercel: !!process.env.TEAM_ID_VERCEL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    // Show partial token for debugging (first 10 chars)
    tokenPrefix: process.env.VERCEL_API_TOKEN ? 
      process.env.VERCEL_API_TOKEN.substring(0, 10) + '...' : 
      'not set',
    edgeConfigPrefix: process.env.EDGE_CONFIG ?
      process.env.EDGE_CONFIG.substring(0, 30) + '...' :
      'not set'
  })
}