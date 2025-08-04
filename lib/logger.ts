// Simple logger utility that can be easily configured for different environments
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, error?: unknown) => {
    // Always log errors regardless of environment
    console.error(`[ERROR] ${message}`, error)
    // In production, you might want to send errors to a monitoring service
  },
  
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data)
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data)
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (isDevelopment && process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
}