/**
 * Utility functions for anonymizing sensitive financial data
 */

/**
 * Masks a numeric value with asterisks
 * @param value - The value to mask
 * @param isAnonymized - Whether anonymization is enabled
 * @returns The original value or masked string
 */
export function maskValue(value: number | string | undefined, isAnonymized: boolean): string {
  if (!isAnonymized) {
    if (value === undefined) return 'N/A'
    return value.toString()
  }
  return '***'
}

/**
 * Masks currency values
 * @param value - The currency value to mask
 * @param isAnonymized - Whether anonymization is enabled
 * @param currency - Currency code (default: NZD)
 * @returns Formatted currency or masked string
 */
export function maskCurrency(
  value: number | undefined, 
  isAnonymized: boolean,
  currency: string = 'NZD'
): string {
  if (!isAnonymized) {
    if (value === undefined) return 'N/A'
    const safe = isNaN(value) ? 0 : value
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe)
  }
  return currency === 'USD' ? '$***' : 'NZ$***'
}

/**
 * Masks share counts
 * @param shares - Number of shares
 * @param isAnonymized - Whether anonymization is enabled
 * @returns Formatted shares or masked string
 */
export function maskShares(shares: number, isAnonymized: boolean): string {
  if (!isAnonymized) {
    const safe = isNaN(shares) ? 0 : shares
    return new Intl.NumberFormat('en-NZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe)
  }
  return '***'
}

/**
 * Logs uncertain values for review
 * @param valueName - Name of the value
 * @param value - The actual value
 * @param location - File/component location
 */
export function logUncertainValue(valueName: string, value: any, location: string): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[Anonymization Review] ${location} - ${valueName}:`, value)
  }
}