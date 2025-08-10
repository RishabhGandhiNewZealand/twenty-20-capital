'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  password: string | null
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedPassword = localStorage.getItem('adminPassword')
      if (storedPassword) {
        await verifyPassword(storedPassword)
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const verifyPassword = async (pwd: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: pwd }),
      })

      const data = await response.json()
      
      if (data.success) {
        setIsAuthenticated(true)
        setIsAdmin(true) // For now, authenticated users are admins
        setPassword(pwd)
        localStorage.setItem('adminPassword', pwd)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error verifying password:', error)
      return false
    }
  }

  const login = async (pwd: string): Promise<boolean> => {
    const success = await verifyPassword(pwd)
    if (!success) {
      localStorage.removeItem('adminPassword')
      setIsAuthenticated(false)
      setIsAdmin(false)
      setPassword(null)
    }
    return success
  }

  const logout = () => {
    localStorage.removeItem('adminPassword')
    setIsAuthenticated(false)
    setIsAdmin(false)
    setPassword(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, password, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}