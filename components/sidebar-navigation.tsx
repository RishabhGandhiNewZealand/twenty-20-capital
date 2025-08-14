"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Home, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Newspaper, 
  User,
  Shield,
  ShieldOff,
  Database,
  LogIn,
  LogOut as LogOutIcon,
  Briefcase,
  BookOpen,
  Search,
  Users
} from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { Button } from "@/components/ui/button"
import { useStackApp, useUser } from "@stackframe/stack"

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
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

type Props = { adminEmail?: string }

export default function SidebarNavigation({ adminEmail = "" }: Props) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInsightsOpen, setIsInsightsOpen] = useState(true)
  const [isResearchOpen, setIsResearchOpen] = useState(true)
  const { isAnonymized, setAnonymized } = useAnonymization()
  const user = useUser()
  const stack = useStackApp()

  const rawUserEmail = useMemo(() => getRawEmail(user), [user])
  const userEmail = rawUserEmail
  const displayName = useMemo(() => {
    const base = (user?.displayName || user?.name || user?.username || userEmail.split("@")[0] || "").toString()
    return toTitleCase(base)
  }, [user, userEmail])

  const isAdmin = useMemo(() => rawUserEmail === adminEmail, [rawUserEmail, adminEmail])

  useEffect(() => {
    setAnonymized(!isAdmin)
  }, [isAdmin, setAnonymized])

  // Basic nav items that are always visible
  const basicNavItems = [
    { href: "/", label: "Home", icon: Home },
  ]

  // Portfolio links - only My Portfolio for both admin and non-admin
  const portfolioItems = user ? [
    { href: "/portfolio", label: "My Portfolio", icon: Briefcase }
  ] : []

  // Rish's Insights section items
  const rishInsightsItems = [
    { href: "/rishs-portfolio", label: "Rish's Portfolio", icon: TrendingUp },
    { href: "/analyses", label: "Analyses", icon: BarChart3 },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/investment-thesis", label: "Investment Thesis", icon: BookOpen },
  ]

  // Research section items
  const researchItems = [
    { href: "/news", label: "News", icon: Newspaper },
  ]

  // Other nav items
  const otherNavItems = [
    { href: "/about-us", label: "About Us", icon: Users },
  ]

  // Get current page info for header
  const allNavItems = [...basicNavItems, ...portfolioItems, ...rishInsightsItems, ...researchItems, ...otherNavItems]
  let currentPage = allNavItems.find(item => item.href === pathname) || allNavItems[0]
  
  // Special handling for renamed/moved pages
  if (pathname === '/investment-thesis') {
    currentPage = { href: '/investment-thesis', label: 'Investment Thesis', icon: BookOpen }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!isOpen) return
      const sidebar = document.querySelector('[data-sidebar-root]') as HTMLElement | null
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [isOpen])

  return (
    <>
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="flex items-center h-full px-4">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/logo.png" 
              alt="Rish Invests Logo" 
              width={32} 
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="text-base sm:text-lg font-bold">Rish Invests</span>
          </Link>

          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-3 p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* Current Page */}
          <div className="ml-3 flex items-center space-x-2 text-muted-foreground">
            <currentPage.icon className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">{currentPage.label}</span>
          </div>

          {/* Right side: Theme + User */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {/* Desktop auth controls */}
            <div className="hidden sm:flex items-center gap-2">
              {!user ? (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="ml-2">
                    Login / Sign Up
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => stack.signOut()}>
                    <LogOutIcon className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile icon-only auth controls */}
            <div className="flex sm:hidden items-center gap-1">
              {!user ? (
                <Link href="/login" aria-label="Login or Sign Up">
                  <Button variant="ghost" size="icon">
                    <LogIn className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => stack.signOut()}>
                  <LogOutIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        data-sidebar-root
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-64 bg-background/95 backdrop-blur-sm border-r border-border transition-transform duration-300 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="h-full flex flex-col overflow-y-auto p-4">
          <ul className="space-y-1 flex-1">
            {/* Home */}
            {basicNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}

            {/* My Portfolio - for all logged-in users */}
            {portfolioItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}

            {/* Rish's Insights Section - visible for all users */}
            <li className="mt-4">
              <button
                onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-accent rounded-md transition-colors"
              >
                <span>Rish's Insights</span>
                {isInsightsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {isInsightsOpen && (
                <ul className="mt-1 ml-3 space-y-1">
                  {rishInsightsItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>

            {/* Research Section */}
            <li className="mt-4">
              <button
                onClick={() => setIsResearchOpen(!isResearchOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-accent rounded-md transition-colors"
              >
                <span>Research</span>
                {isResearchOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {isResearchOpen && (
                <ul className="mt-1 ml-3 space-y-1">
                  {researchItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>

            {/* Other Nav Items */}
            {otherNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href} className="mt-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
            
            {/* Trades link - only visible for admin users */}
            {isAdmin && !isAnonymized && (
              <li>
                <Link
                  href="/trades"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === "/trades"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Database className="h-5 w-5" />
                  <span>Trades</span>
                </Link>
              </li>
            )}
          </ul>
          
          {/* Auth control at the bottom */}
          <div className="pt-4 mt-4 border-t border-border">
            {!user ? (
              <Link href="/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Login / Sign Up</span>
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-muted-foreground px-1 hidden sm:block">
                  Logged in as {displayName} ({userEmail})
                </div>
                <div className="text-xs text-muted-foreground px-1 hidden sm:block">
                  {isAdmin ? "Full view enabled" : "Standard view (values hidden)"}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => stack.redirectToAccountSettings()}>
                    Manage account
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => stack.signOut()}>
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ top: '4rem' }}
        />
      )}

      {/* Main content spacer */}
      <div className="h-16" />
    </>
  )
}