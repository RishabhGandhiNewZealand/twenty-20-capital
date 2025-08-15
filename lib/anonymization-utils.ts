/**
 * Utilities for anonymizing sensitive financial data
 */

/**
 * Mask a generic value
 * @param value The value to mask
 * @param isAnonymized Whether to apply masking
 * @returns Masked or original value
 */
export function maskValue(value: number | string | undefined, isAnonymized: boolean): string {
  if (!isAnonymized) {
    if (value === undefined || value === null) return 'N/A'
    if (typeof value === 'number' && isNaN(value)) return '0'
    return value.toString()
  }
  return '***'
}

/**
 * Mask currency values
 * @param value The currency value
 * @param isAnonymized Whether to apply masking
 * @param currency Currency code
 * @returns Masked or formatted currency
 */
export function maskCurrency(
  value: number | undefined, 
  isAnonymized: boolean,
  currency: string = 'NZD'
): string {
  if (!isAnonymized) {
    if (value === undefined || value === null) return 'N/A'
    if (isNaN(value)) return `${currency === 'USD' ? 'US' : currency}$0.00`
    
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
  return currency === 'USD' ? 'US$***' : 'NZ$***'
}

/**
 * Mask share quantities
 * @param shares Number of shares
 * @param isAnonymized Whether to apply masking
 * @returns Masked or formatted shares
 */
export function maskShares(shares: number, isAnonymized: boolean): string {
  if (!isAnonymized) {
    if (shares === undefined || shares === null || isNaN(shares)) return '0.00'
    
    return new Intl.NumberFormat('en-NZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(shares)
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