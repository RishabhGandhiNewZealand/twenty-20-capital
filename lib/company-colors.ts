/**
 * Generates a consistent color for a company based on its symbol
 * This ensures the same company always gets the same color
 */

// Predefined colors for major companies using blue-based theme
const PREDEFINED_COLORS: Record<string, string> = {
  'AAPL': '#3b82f6',      // Apple - Primary Blue
  'GOOGL': '#2563eb',     // Google - Darker Blue
  'MSFT': '#1d4ed8',      // Microsoft - Deep Blue
  'AMZN': '#1e40af',      // Amazon - Navy Blue
  'META': '#60a5fa',      // Meta - Light Blue
  'NVDA': '#10b981',      // Nvidia - Green (matching S&P 500)
  'TSLA': '#6366f1',      // Tesla - Indigo
  'NFLX': '#8b5cf6',      // Netflix - Purple
  'UBER': '#4f46e5',      // Uber - Indigo Blue
  'CRM': '#0ea5e9',       // Salesforce - Sky Blue
  'MA': '#06b6d4',        // Mastercard - Cyan
  'UNH': '#14b8a6',       // UnitedHealth - Teal
  'ASML': '#0891b2',      // ASML - Cyan Blue
  'SPGI': '#0e7490',      // S&P Global - Dark Cyan
  'MSCI': '#155e75',      // MSCI - Dark Teal
  'ANET': '#164e63',      // Arista - Very Dark Teal
  'ZETA': '#7c3aed',      // Zeta - Violet
  'CP': '#9333ea',        // Canadian Pacific - Purple
  'MFT': '#a855f7',       // MFT - Light Purple
}

/**
 * Simple hash function to convert string to number
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a consistent color for a company symbol
 * @param symbol - The company ticker symbol
 * @returns HSL color string
 */
export function getCompanyColor(symbol: string): string {
  // Check if we have a predefined color
  if (PREDEFINED_COLORS[symbol]) {
    return PREDEFINED_COLORS[symbol]
  }
  
  // Generate a consistent color based on the symbol hash
  const hash = hashCode(symbol)
  
  // Use golden ratio to distribute colors evenly within blue spectrum
  const goldenRatio = 0.618033988749895
  const hueBase = 217 // Base blue hue
  const hueRange = 60 // Range around blue (187-247)
  const hue = hueBase + ((hash * goldenRatio * hueRange) % hueRange) - (hueRange / 2)
  
  // Keep saturation and lightness consistent for visual harmony
  const saturation = 70 + (hash % 20) // 70-90%
  const lightness = 50 + (hash % 15)  // 50-65%
  
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`
}

/**
 * Get colors for a list of companies, ensuring good visual distinction
 * @param symbols - Array of company ticker symbols
 * @returns Map of symbol to color
 */
export function getCompanyColors(symbols: string[]): Map<string, string> {
  const colorMap = new Map<string, string>()
  
  symbols.forEach(symbol => {
    colorMap.set(symbol, getCompanyColor(symbol))
  })
  
  return colorMap
}