/**
 * Generates a consistent color for a company based on its symbol
 * This ensures the same company always gets the same color
 */

// Predefined colors for major companies (optional - for better visual distinction)
const PREDEFINED_COLORS: Record<string, string> = {
  'AAPL': 'hsl(0, 40%, 35%)',      // Apple - Red
  'GOOGL': 'hsl(217, 40%, 35%)',   // Google - Blue
  'MSFT': 'hsl(120, 40%, 35%)',    // Microsoft - Green
  'AMZN': 'hsl(39, 40%, 35%)',     // Amazon - Orange
  'META': 'hsl(220, 40%, 35%)',    // Meta - Blue
  'NVDA': 'hsl(120, 40%, 35%)',    // Nvidia - Green
  'TSLA': 'hsl(0, 40%, 35%)',      // Tesla - Red
  'NFLX': 'hsl(0, 60%, 35%)',      // Netflix - Bright Red
  'UBER': 'hsl(0, 0%, 20%)',       // Uber - Black
  'CRM': 'hsl(204, 70%, 35%)',     // Salesforce - Light Blue
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
  
  // Use golden ratio to distribute colors evenly
  const goldenRatio = 0.618033988749895
  const hue = (hash * goldenRatio * 360) % 360
  
  // Keep saturation and lightness consistent for visual harmony
  const saturation = 40 + (hash % 20) // 40-60%
  const lightness = 35 + (hash % 10)  // 35-45%
  
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