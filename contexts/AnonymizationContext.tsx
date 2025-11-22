"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AnonymizationContextType {
  isAnonymized: boolean
  toggleAnonymization: () => void
  setAnonymized: (value: boolean) => void
}

const AnonymizationContext = createContext<AnonymizationContextType | undefined>(undefined)

export function AnonymizationProvider({ children }: { children: ReactNode }) {
  // Default to non-anonymized mode as requested
  const [isAnonymized, setIsAnonymized] = useState(false)

  const toggleAnonymization = () => {
    setIsAnonymized(prev => !prev)
  }

  const setAnonymized = (value: boolean) => {
    setIsAnonymized(value)
  }

  return (
    <AnonymizationContext.Provider value={{ isAnonymized, toggleAnonymization, setAnonymized }}>
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