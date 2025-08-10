"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface PrivacyContextType {
  isDataMasked: boolean
  setIsDataMasked: (masked: boolean) => void
  maskValue: (value: string | number, type?: 'currency' | 'number' | 'shares') => string
  maskCurrency: (value: number) => string
  maskNumber: (value: number, decimals?: number) => string
  maskShares: (value: number) => string
  isAuthenticated: boolean
  authenticate: (password: string) => Promise<boolean>
  logout: () => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isDataMasked, setIsDataMasked] = useState(true) // Default to masked
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load authentication state from sessionStorage on mount
  useEffect(() => {
    const authState = sessionStorage.getItem('portfolio-auth')
    if (authState === 'authenticated') {
      setIsAuthenticated(true)
      setIsDataMasked(false)
    }
  }, [])

  // Authenticate with password
  const authenticate = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setIsDataMasked(false)
        sessionStorage.setItem('portfolio-auth', 'authenticated')
        return true
      }
      return false
    } catch (error) {
      console.error('Authentication error:', error)
      return false
    }
  }

  // Logout and re-enable masking
  const logout = () => {
    setIsAuthenticated(false)
    setIsDataMasked(true)
    sessionStorage.removeItem('portfolio-auth')
  }

  // Mask a currency value
  const maskCurrency = (value: number): string => {
    if (!isDataMasked || value === 0) return `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    return '$*****'
  }

  // Mask a number value
  const maskNumber = (value: number, decimals: number = 0): string => {
    if (!isDataMasked || value === 0) {
      return value.toLocaleString('en-NZ', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })
    }
    return '****'
  }

  // Mask share count
  const maskShares = (value: number): string => {
    if (!isDataMasked) {
      return value.toLocaleString('en-NZ', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    }
    return '**.**'
  }

  // Generic mask function
  const maskValue = (value: string | number, type: 'currency' | 'number' | 'shares' = 'number'): string => {
    if (typeof value === 'string') {
      if (!isDataMasked) return value
      
      // Check if it's a currency string
      if (value.includes('$')) {
        return '$*****'
      }
      
      // For other strings, mask numbers within them
      return value.replace(/\d+([.,]\d+)?/g, '****')
    }

    switch (type) {
      case 'currency':
        return maskCurrency(value)
      case 'shares':
        return maskShares(value)
      default:
        return maskNumber(value)
    }
  }

  return (
    <PrivacyContext.Provider
      value={{
        isDataMasked,
        setIsDataMasked,
        maskValue,
        maskCurrency,
        maskNumber,
        maskShares,
        isAuthenticated,
        authenticate,
        logout
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}