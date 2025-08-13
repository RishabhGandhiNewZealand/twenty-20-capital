"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  TrendingUp, 
  FileText, 
  Newspaper, 
  Menu, 
  X, 
  Shield, 
  ShieldOff, 
  Database, 
  Info,
  LogOut,
  LogIn,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAnonymization } from "@/contexts/AnonymizationContext"

export default function SidebarNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isAnonymized, setAnonymized } = useAnonymization()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  // Check if user is admin based on localStorage (temporary solution)
  const isAdmin = userName === "Rishabh Gandhi";

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsLoggedIn(true);
      setUserName(user.name);
      setAnonymized(!user.isAdmin);
    } else {
      setAnonymized(true);
    }
  }, [setAnonymized]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const handleLogin = () => {
    // For now, simulate login with the admin user
    const user = {
      name: "Rishabh Gandhi",
      email: "mailto.rishabhgandhi@gmail.com",
      isAdmin: true
    };
    localStorage.setItem("user", JSON.stringify(user));
    setIsLoggedIn(true);
    setUserName(user.name);
    setAnonymized(!user.isAdmin);
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserName(null);
    setAnonymized(true);
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Rish Invests</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Add padding to main content on mobile to account for fixed header */}
      <div className="md:hidden h-16" />

      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 h-full bg-background border-r border-border
          transition-transform duration-300 ease-in-out z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'top-16 w-64' : 'top-0 w-64'}
        `}
      >
        <nav className="flex flex-col h-full">
          {/* Desktop Header */}
          {!isMobile && (
            <div className="p-6 border-b border-border">
              <Link href="/" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">Rish Invests</span>
              </Link>
            </div>
          )}
          
          <ul className="flex-1 space-y-2 p-4">
            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Portfolio</span>
              </Link>
            </li>
            <li>
              <Link
                href="/analyses"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/analyses" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span>Analyses</span>
              </Link>
            </li>
            <li>
              <Link
                href="/reports"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/reports" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Reports</span>
              </Link>
            </li>
            <li>
              <Link
                href="/news"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/news" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <Newspaper className="h-5 w-5" />
                <span>News</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/about" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <Info className="h-5 w-5" />
                <span>About</span>
              </Link>
            </li>
            {/* Only show trades for admin users */}
            {isAdmin && (
              <li>
                <Link
                  href="/trades"
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/trades" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Database className="h-5 w-5" />
                  <span>Trades</span>
                </Link>
              </li>
            )}
          </ul>
          
          {/* User info and authentication section at the bottom */}
          <div className="pt-4 mt-4 border-t border-border p-4">
            {isLoggedIn ? (
              <>
                {/* User info */}
                <div className="mb-3 px-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{userName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? "Admin - Full View" : "Standard View"}
                  </p>
                </div>
                
                {/* View status */}
                <div className="mb-3 px-1">
                  <div className="flex items-center space-x-2">
                    {isAnonymized ? (
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isAnonymized 
                        ? "Portfolio values are hidden" 
                        : "Showing actual values"}
                    </p>
                  </div>
                </div>
                
                {/* Logout button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                {/* Login button */}
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Login</span>
                </Button>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Sign in to view portfolio
                </p>
              </>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ top: '4rem' }}
        />
      )}
    </>
  )
}