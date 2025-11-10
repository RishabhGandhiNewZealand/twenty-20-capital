"use client"

import { useState, useEffect } from "react"
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
  Briefcase,
  BookOpen,
  Users,
  Settings,
  LogIn,
  LogOut
} from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useUser } from "@stackframe/stack"

export default function SidebarNavigation() {
  const user = useUser({ or: 'return-null' });
  const isAdmin = user && process.env.NEXT_PUBLIC_ADMIN_EMAIL && user.primaryEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInsightsOpen, setIsInsightsOpen] = useState(true)
  const [isResearchOpen, setIsResearchOpen] = useState(true)

  // Navigation items
  const basicNavItems = [
    { href: "/", label: "Home", icon: Home },
  ]

  // Fund Insights section items
  const fundInsightsItems = [
    { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/analyses", label: "Analyses", icon: BarChart3 },
  ]

  // Research section items
  const researchItems = [
    { href: "/news", label: "News", icon: Newspaper },
  ]

  // Other nav items
  const otherNavItems = [
    { href: "/about", label: "About", icon: Users },
  ]

  // Admin nav items (only shown when authenticated as admin)
  const adminNavItems = isAdmin ? [
    { href: "/trades", label: "Manage Trades", icon: Settings },
  ] : []

  // Get current page info for header
  const allNavItems = [...basicNavItems, ...fundInsightsItems, ...researchItems, ...otherNavItems, ...adminNavItems]
  let currentPage = allNavItems.find(item => item.href === pathname) || allNavItems[0]

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
              alt="Twenty 20 Capital Logo" 
              width={32} 
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="text-base sm:text-lg font-bold">Twenty 20 Capital</span>
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

          {/* Right side: Theme Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
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

            {/* Fund Insights Section */}
            <li className="mt-4">
              <button
                onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-accent rounded-md transition-colors"
              >
                <span>Fund Insights</span>
                {isInsightsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {isInsightsOpen && (
                <ul className="mt-1 ml-3 space-y-1">
                  {fundInsightsItems.map((item) => {
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

            {/* Admin Nav Items */}
            {isAdmin && adminNavItems.map((item) => {
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

            {/* Auth Controls */}
            <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.primaryEmail}
                  </div>
                  <Link
                    href="/handler/sign-out"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/handler/sign-in"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Admin Login</span>
                </Link>
              )}
            </li>
          </ul>
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