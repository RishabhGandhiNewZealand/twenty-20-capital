/**
 * Shared formatting utilities to avoid code duplication
 */

/**
 * Format number with specified decimal places
 * @param value Numeric value
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  const safe = isNaN(value) ? 0 : value
  return new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe)
}

/**
 * Format date string to NZ locale
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format currency with proper decimal places
 * This extends the base formatCurrency from financial-calculations
 * to support decimal places
 * @param value Numeric value
 * @param currency Currency code
 * @param decimals Number of decimal places
 * @returns Formatted currency string
 */
export function formatCurrencyWithDecimals(
  value: number | undefined, 
  currency: string = 'NZD',
  decimals: number = 2
): string {
  if (value === undefined) return 'N/A'
  const safe = isNaN(value) ? 0 : value
  
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe)
}