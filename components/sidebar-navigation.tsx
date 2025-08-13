"use client"

import { useState, useEffect } from "react"
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
  User,
  Shield,
  ShieldOff,
  Database,
  LogIn,
  LogOut
} from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { Button } from "@/components/ui/button"
import { useStackAuth } from "@/hooks/useStackAuth"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analyses", label: "Analyses", icon: BarChart3 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/about", label: "About", icon: User },
]

export default function SidebarNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isAnonymized, toggleAnonymization, isAdmin } = useAnonymization()
  const { stackApp, user, isConfigured } = useStackAuth()

  // Get current page info
  const currentPage = navItems.find(item => item.href === pathname) || navItems[0]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Close sidebar on mobile by default
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const handleLogin = () => {
    if (stackApp) {
      stackApp.signIn()
    }
  }

  const handleLogout = () => {
    if (stackApp) {
      stackApp.signOut()
    }
  }

  const handleAnonymizationToggle = () => {
    toggleAnonymization()
  }

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

          {/* User info and Theme Toggle - Right side */}
          <div className="ml-auto flex items-center space-x-4">
            {user && (
              <span className="text-sm font-medium">
                {user.displayName || user.primaryEmail?.split('@')[0]}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-64 bg-background/95 backdrop-blur-sm border-r border-border transition-transform duration-300 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="h-full flex flex-col overflow-y-auto p-4">
          <ul className="space-y-1 flex-1">
            {navItems.map((item) => {
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
            
            {/* Trades link - only visible for admin users */}
            {isAdmin && (
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
          
          {/* Authentication and View Toggle at the bottom */}
          <div className="pt-4 mt-4 border-t border-border space-y-2">
            {/* Login/Logout Button - only show if Stack is configured */}
            {isConfigured && (
              user ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Login</span>
                </Button>
              )
            )}

            {/* Anonymization Toggle - only visible for admin */}
            {isAdmin && (
              <>
                <Button
                  onClick={handleAnonymizationToggle}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  {isAnonymized ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      <span>Anonymized View</span>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      <span>Full View</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground px-1">
                  {isAnonymized 
                    ? "Portfolio values are hidden" 
                    : "Showing actual values"}
                </p>
              </>
            )}

            {/* Show login status for non-admin users */}
            {user && !isAdmin && (
              <p className="text-xs text-muted-foreground px-1">
                Standard view (limited access)
              </p>
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