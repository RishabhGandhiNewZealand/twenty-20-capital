"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Newspaper, 
  Shield,
  Database,
  LogOut as LogOutIcon,
  Briefcase,
  BookOpen,
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

type Props = { 
  adminEmail?: string 
  children?: React.ReactNode
}

export default function SidebarNavigation({ adminEmail = "", children }: Props) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false) // Default to closed
  const [isMobile, setIsMobile] = useState(false)
  const { setAnonymized } = useAnonymization()
  const user = useUser()
  const stack = useStackApp()

  const rawUserEmail = useMemo(() => getRawEmail(user), [user])
  const userEmail = rawUserEmail
  const displayName = useMemo(() => {
    const base = (user?.displayName || user?.name || user?.username || userEmail.split("@")[0] || "").toString()
    return toTitleCase(base)
  }, [user, userEmail])

  const isAdmin = useMemo(() => !!rawUserEmail && !!adminEmail && rawUserEmail === adminEmail, [rawUserEmail, adminEmail])

  // Basic nav items
  const basicNavItems = [
    { href: "/", label: "Home", icon: Home },
  ]

  // Fund Management - Filter out Portfolio if admin
  const fundManagementItems = isAdmin ? [
    // Removed Portfolio link as requested for admin view
    // { href: "/portfolio", label: "Portfolio", icon: Briefcase }, 
    { href: "/trades", label: "Trades", icon: Database }
  ] : []

  // Fund Insights
  const fundInsightsItems = [
    { href: "/rishs-portfolio", label: "Appreciation Fund", icon: TrendingUp },
    { href: "/analyses", label: "Analyses", icon: BarChart3 },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/investment-thesis", label: "Investment Thesis", icon: BookOpen },
  ]

  // Research
  const researchItems = [
    { href: "/news", label: "News", icon: Newspaper },
  ]

  // Other
  const otherNavItems = [
    { href: "/about-us", label: "About Us", icon: Users },
  ]

  // Combine all items for easy rendering
  const allGroups = [
    { title: null, items: basicNavItems },
    { title: "Fund Management", items: fundManagementItems },
    { title: "Fund Insights", items: fundInsightsItems },
    { title: "Research", items: researchItems },
    { title: null, items: otherNavItems },
  ]

  const flatNavItems = allGroups.flatMap(g => g.items)
  let currentPage = flatNavItems.find(item => item.href === pathname) || flatNavItems[0]
  
  if (pathname === '/investment-thesis') {
    currentPage = { href: '/investment-thesis', label: 'Investment Thesis', icon: BookOpen }
  } else if (pathname === '/portfolio') {
    currentPage = { href: '/portfolio', label: 'Portfolio', icon: Briefcase }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        // Optional: Auto-open on desktop? Keeping it closed by default for now unless user wants otherwise.
        // setIsOpen(true) 
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

  return (
    <>
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="flex items-center h-full px-4">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/logo.png" 
              alt="Twenty-20-Capital Logo" 
              width={32} 
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="text-base sm:text-lg font-bold">Twenty-20-Capital</span>
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
              {user && (
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
              {user && (
                <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => stack.signOut()}>
                  <LogOutIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="pt-16 min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 top-16 z-40 bg-background/95 backdrop-blur-sm border-r border-border transition-all duration-300 overflow-hidden",
            isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full",
            // Mobile: full width or sliding, usually fixed over content. 
            // But requested behavior is "moves the rest of the webpage".
            // On mobile, moving the whole page might be squishy. Usually we overlay on mobile, push on desktop.
            // Let's keep mobile behavior as overlay (or hidden) and desktop as push.
            isMobile && isOpen && "w-64 translate-x-0 shadow-xl"
          )}
        >
          <nav className="h-full flex flex-col overflow-y-auto p-4 w-64">
            <ul className="space-y-6 flex-1">
              {allGroups.map((group, groupIndex) => (
                group.items.length > 0 && (
                  <li key={groupIndex}>
                    {group.title && (
                      <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.title}
                      </h3>
                    )}
                    <ul className="space-y-1">
                      {group.items.map((item) => {
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
                  </li>
                )
              ))}
            </ul>
            
            {/* Auth control at the bottom */}
            <div className="pt-4 mt-auto border-t border-border">
              {!user ? (
                <div className="flex justify-center">
                  <Link href="/portal-access" aria-label="Admin Access">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-20 hover:opacity-100 transition-opacity">
                      <Shield className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground px-1 hidden sm:block">
                    Logged in as {displayName} ({userEmail})
                  </div>
                  <div className="text-xs text-muted-foreground px-1 hidden sm:block">
                    {isAdmin ? "Full view enabled" : "Standard view"}
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

        {/* Content Wrapper */}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 w-full",
            // On desktop, add left margin when open to simulate "push"
            !isMobile && isOpen ? "ml-64" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>

      {/* Overlay for mobile only */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ top: '4rem' }}
        />
      )}
    </>
  )
}