"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useStackUser } from '@/hooks/useStackAuth'

interface AnonymizationContextType {
  isAnonymized: boolean
  toggleAnonymization: () => void
  setAnonymized: (value: boolean) => void
  isAdmin: boolean
}

const AnonymizationContext = createContext<AnonymizationContextType | undefined>(undefined)

const ADMIN_EMAIL = 'mailto.rishabhgandhi@gmail.com'

export function AnonymizationProvider({ children }: { children: ReactNode }) {
  const user = useStackUser()
  const [isAnonymized, setIsAnonymized] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user is logged in and is admin
    if (user) {
      const userIsAdmin = user.primaryEmail === ADMIN_EMAIL
      setIsAdmin(userIsAdmin)
      // If user is admin, show full view by default
      if (userIsAdmin) {
        setIsAnonymized(false)
      } else {
        // Non-admin users always see anonymized view
        setIsAnonymized(true)
      }
    } else {
      // Not logged in - show anonymized view
      setIsAnonymized(true)
      setIsAdmin(false)
    }
  }, [user])

  const toggleAnonymization = () => {
    // Only admin can toggle anonymization
    if (isAdmin) {
      setIsAnonymized(prev => !prev)
    }
  }

  const setAnonymized = (value: boolean) => {
    // Only admin can change anonymization state
    if (isAdmin) {
      setIsAnonymized(value)
    }
  }

  return (
    <AnonymizationContext.Provider value={{ isAnonymized, toggleAnonymization, setAnonymized, isAdmin }}>
      {children}
    </AnonymizationContext.Provider>
  )
}

export function useAnonymization() {
  const context = useContext(AnonymizationContext)
  if (context === undefined) {
    throw new Error('useAnonymization must be used within an AnonymizationProvider')
  }
  return context
}