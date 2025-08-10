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
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { usePrivacy } from "@/lib/privacy-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { isDataMasked, isAuthenticated, authenticate, logout } = usePrivacy()

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

  const handlePrivacyToggle = () => {
    if (isAuthenticated) {
      // If authenticated, allow toggling or logout
      if (isDataMasked) {
        // Currently masked but authenticated, just unmask
        logout()
      } else {
        // Currently unmasked, mask the data
        logout()
      }
    } else {
      // Not authenticated, show password dialog
      setShowPasswordDialog(true)
      setPassword("")
      setError("")
    }
  }

  const handlePasswordSubmit = async () => {
    const success = await authenticate(password)
    if (success) {
      setShowPasswordDialog(false)
      setPassword("")
      setError("")
    } else {
      setError("Invalid password")
    }
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

          {/* Theme Toggle - Right side */}
          <div className="ml-auto">
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
        <nav className="h-full flex flex-col">
          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
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
            </ul>
          </div>

          {/* Privacy Toggle at Bottom */}
          <div className="border-t border-border p-4">
            <button
              onClick={handlePrivacyToggle}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isDataMasked 
                  ? "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900"
                  : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
              )}
            >
              <div className="flex items-center space-x-2">
                {isDataMasked ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Data Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Data Visible</span>
                  </>
                )}
              </div>
              {isAuthenticated ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </button>
          </div>
        </nav>
      </aside>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Admin Password</DialogTitle>
            <DialogDescription>
              Enter the admin password to view portfolio values
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
                placeholder="Enter password"
              />
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordSubmit}>
                Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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