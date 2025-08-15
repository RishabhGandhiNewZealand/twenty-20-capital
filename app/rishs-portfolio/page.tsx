"use client"

import { useEffect, useState } from "react"
import { ExitedPosition } from "@/types/portfolio"
import { PortfolioView, createPortfolioStats } from "@/components/portfolio-view"
import { useAnonymization } from "@/contexts/AnonymizationContext"
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

export default function HomePage() {
  const [holdings, setHoldings] = useState<CurrentHolding[]>([])
  const [exitedPositions, setExitedPositions] = useState<ExitedPosition[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAnonymized } = useAnonymization()
  const [portfolioStats, setPortfolioStats] = useState(
    createPortfolioStats("Loading...", 0, 0, "Calculating current value", isAnonymized)
  )

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Fetch all data in parallel for better performance (with cache busting)
        const timestamp = Date.now()
        const [currentResponse, portfolioResponse, historyResponse] = await Promise.all([
          fetch(`/api/portfolio-current?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/portfolio?t=${timestamp}`, { cache: 'no-store' }).catch((error) => {
            console.error('Failed to fetch portfolio data:', error)
            return null
          }),
          fetch(`/api/portfolio-history?t=${timestamp}`, { cache: 'no-store' }).catch((error) => {
            console.error('Failed to fetch portfolio history:', error)
            return null
          })
        ])

        // Handle current portfolio data (required)
        if (!currentResponse.ok) {
          throw new Error('Failed to load portfolio data')
        }
        const currentData = await currentResponse.json()
        
        setHoldings(currentData.holdings)
        setSummary(currentData.summary)

        // Handle exited positions (optional)
        if (portfolioResponse && portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          setExitedPositions(portfolioData.exitedPositions)
        }

        // Handle portfolio history for accurate values (optional but preferred)
        if (historyResponse && historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (historyData.history && historyData.history.length > 0) {
            setPortfolioHistory(historyData.history)
            const latestHistory = historyData.history[historyData.history.length - 1]
            
            // Update summary with values from portfolio history (source of truth)
            const updatedSummary = {
              ...currentData.summary,
              totalValueNZD: latestHistory.portfolioValue,
              totalCostBasisNZD: latestHistory.costBasis,
              totalGainNZD: latestHistory.portfolioValue - latestHistory.costBasis,
              totalGainPercent: ((latestHistory.portfolioValue - latestHistory.costBasis) / latestHistory.costBasis * 100),
              sp500Value: latestHistory.sp500Value,
              sp500GainNZD: latestHistory.sp500Value - latestHistory.costBasis,
              sp500GainPercent: ((latestHistory.sp500Value - latestHistory.costBasis) / latestHistory.costBasis * 100)
            }
            setSummary(updatedSummary)

            // Update portfolio stats with the accurate data
            const formattedValue = formatCurrency(latestHistory.portfolioValue)

            // Calculate CAGR from the gain percentages
            const yearsSinceInception = getYearsSinceInception()
            const portfolioCAGR = calculateCAGRFromGainPercent(updatedSummary.totalGainPercent, yearsSinceInception)
            const sp500CAGR = calculateCAGRFromGainPercent(updatedSummary.sp500GainPercent, yearsSinceInception)

            setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Current portfolio value", isAnonymized))
          }
        } else {
          // Fallback to using data from portfolio-current if history fails
          const { totalValueNZD, totalGainPercent, sp500GainPercent } = currentData.summary
          
          const formattedValue = formatCurrency(totalValueNZD)

          // Calculate CAGR from the gain percentages
          const yearsSinceInception = getYearsSinceInception()
          const portfolioCAGR = calculateCAGRFromGainPercent(totalGainPercent, yearsSinceInception)
          const sp500CAGR = calculateCAGRFromGainPercent(sp500GainPercent, yearsSinceInception)

          setPortfolioStats(createPortfolioStats(formattedValue, portfolioCAGR, sp500CAGR, "Current portfolio value", isAnonymized))
        }

      } catch (error) {
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
  }, [isAnonymized])

  return (
    <PortfolioView
      holdings={holdings}
      exitedPositions={exitedPositions}
      summary={summary}
      loading={loading}
      isAnonymized={isAnonymized}
      portfolioStats={portfolioStats}
      portfolioHistory={portfolioHistory}
    />
  )
}
