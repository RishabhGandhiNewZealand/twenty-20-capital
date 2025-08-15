"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioView, createPortfolioStats } from "@/components/portfolio-view"
import { getYearsSinceInception } from "@/lib/constants"
import { calculateCAGRFromGainPercent, formatCurrency } from "@/lib/financial-calculations"

interface CurrentHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  currentValueNZD: number
  costBasisNZD: number
  gainNZD: number
  gainPercent: number
  allocation: number
  currency: string
}

interface PortfolioSummary {
  totalValueNZD: number
  totalCostBasisNZD: number
  totalGainNZD: number
  totalGainPercent: number
  sp500Value: number
  sp500GainNZD: number
  sp500GainPercent: number
  exchangeRate: number
}

function getRawEmail(u: any): string {
  return (
    u?.primaryEmail ||
    u?.email ||
    u?.primaryEmailAddress?.emailAddress ||
    u?.primaryEmailAddress?.email ||
    ""
  )
  .toString()
}

interface Props {
  adminEmail: string
}

export default function MyPortfolioClient({ adminEmail }: Props) {
  const router = useRouter()
  const user = useUser()
  const rawUserEmail = useMemo(() => getRawEmail(user), [user])
  const isAdmin = useMemo(() => rawUserEmail === adminEmail, [rawUserEmail, adminEmail])
  
  const [holdings, setHoldings] = useState<CurrentHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolioStats, setPortfolioStats] = useState(
    createPortfolioStats("Loading...", 0, 0, "Calculating your portfolio value", false)
  )

  // Get user identifier for API calls
  const userIdentifier = user?.id || rawUserEmail

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login")
      return
    }
    
    // If admin, redirect to Rish's portfolio
    if (isAdmin) {
      router.push("/rishs-portfolio")
      return
    }
  }, [user, isAdmin, router])

  useEffect(() => {
    if (!user || isAdmin) return

    const fetchPortfolioData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const timestamp = Date.now()
        const [portfolioResponse, historyResponse] = await Promise.all([
          fetch(`/api/user-portfolio?t=${timestamp}`, {
            headers: {
              'x-user-id': userIdentifier,
              'x-user-email': rawUserEmail,
              'x-is-admin': 'false',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          }),
          fetch(`/api/user-portfolio-history?t=${timestamp}`, {
            headers: {
              'x-user-id': userIdentifier,
              'x-user-email': rawUserEmail,
              'x-is-admin': 'false',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          }).catch((error) => {
            console.error('Failed to fetch portfolio history:', error)
            return null
          })
        ])

        // Handle current portfolio data (required)
        if (!portfolioResponse.ok) {
          throw new Error('Failed to load portfolio data')
        }
        const portfolioData = await portfolioResponse.json()
        
        setHoldings(portfolioData.holdings || [])
        setSummary(portfolioData.summary || null)
        
        // For now, we don't have exited positions API for users yet
        setExitedPositions([])

        // Handle portfolio history for accurate values (optional but preferred)
        if (historyResponse && historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (historyData.history && historyData.history.length > 0) {
            setPortfolioHistory(historyData.history)
            const latestHistory = historyData.history[historyData.history.length - 1]
            
            // Update summary with values from portfolio history (source of truth)
            const updatedSummary = {
              ...portfolioData.summary,
              totalValueNZD: latestHistory.portfolioValue,
              totalCostBasisNZD: latestHistory.costBasis,
              totalGainNZD: latestHistory.portfolioValue - latestHistory.costBasis,
              totalGainPercent: latestHistory.costBasis > 0 ? ((latestHistory.portfolioValue - latestHistory.costBasis) / latestHistory.costBasis * 100) : 0,
              sp500Value: latestHistory.sp500Value,
              sp500GainNZD: latestHistory.sp500Value - latestHistory.costBasis,
              sp500GainPercent: latestHistory.costBasis > 0 ? ((latestHistory.sp500Value - latestHistory.costBasis) / latestHistory.costBasis * 100) : 0
            }
            setSummary(updatedSummary)

            // Update portfolio stats with the accurate data
            const formattedValue = formatCurrency(latestHistory.portfolioValue)

            // Calculate CAGR from the gain percentages
            const yearsSinceInception = getYearsSinceInception()
            const portfolioCAGR = calculateCAGRFromGainPercent(updatedSummary.totalGainPercent, yearsSinceInception)
            const sp500CAGR = calculateCAGRFromGainPercent(updatedSummary.sp500GainPercent, yearsSinceInception)

            setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Your portfolio value", false))
          }
        } else if (portfolioData.summary) {
          // Fallback to using data from user-portfolio if history fails
          const { totalValueNZD, totalGainPercent, sp500GainPercent } = portfolioData.summary
          
          const formattedValue = formatCurrency(totalValueNZD)

          // Calculate CAGR from the gain percentages
          const yearsSinceInception = getYearsSinceInception()
          const portfolioCAGR = calculateCAGRFromGainPercent(totalGainPercent, yearsSinceInception)
          const sp500CAGR = calculateCAGRFromGainPercent(sp500GainPercent, yearsSinceInception)

          setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Your portfolio value", false))
        }

      } catch (error) {
        console.error('Error fetching portfolio:', error)
        // Update portfolio stats to show error
        setPortfolioStats(prev => prev.map((stat, index) => 
          index === 0 ? { 
            ...stat, 
            value: "Error",
            subtitle: "Failed to load portfolio data",
            description: undefined 
          } : stat
        ))
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [user, userIdentifier, rawUserEmail, isAdmin])

  // Don't render anything for admin users
  if (isAdmin) {
    return null
  }

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <PortfolioView
      holdings={holdings}
      exitedPositions={exitedPositions}
      summary={summary}
      loading={loading}
      isAnonymized={false}
      portfolioStats={portfolioStats}
      portfolioHistory={portfolioHistory}
    />
  )
}