"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ChartLine, User } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"

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

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login")
      return
    }
    
    // If admin, redirect to Rish's portfolio
    if (isAdmin) {
      router.push("/portfolio")
      return
    }
  }, [user, isAdmin, router])

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

  const portfolioStats = [
    {
      title: "Portfolio Value",
      value: "Coming Soon",
      subtitle: "Your portfolio value",
      icon: DollarSign,
    },
    {
      title: "Total Return", 
      value: "—",
      description: "Your total returns",
      icon: TrendingUp,
    },
    {
      title: "Performance",
      value: "—",
      description: "Your portfolio performance",
      icon: ChartLine,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
          <p className="text-gray-600">Track your personal investment portfolio</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {portfolioStats.map((stat, index) => (
            <Card key={index} className="border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Portfolio Content Placeholder */}
        <Card className="border-blue-100">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Portfolio Dashboard</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                This feature is coming soon. You'll be able to track your own investment portfolio, 
                monitor performance, and analyze your holdings here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}