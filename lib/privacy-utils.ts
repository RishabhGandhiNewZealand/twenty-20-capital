import { formatCurrency as baseCurrency } from '@/lib/financial-calculations'
import { formatNumber as baseNumber, formatCurrencyWithDecimals as baseCurrencyWithDecimals } from '@/lib/format-utils'

// Privacy-aware formatting functions that can be used in both client and server components
// These return masked values when privacy mode is enabled

export interface PrivacyOptions {
  isDataMasked: boolean
}

/**
 * Format currency with privacy masking
 * @param value - The numeric value to format
 * @param options - Privacy options
 * @returns Formatted currency string or masked value
 */
export function formatCurrencyPrivate(value: number, options: PrivacyOptions): string {
  if (options.isDataMasked && value !== 0) {
    return '$*****'
  }
  return baseCurrency(value)
}

/**
 * Format currency with decimals and privacy masking
 * @param value - The numeric value to format
 * @param currency - The currency code (USD, NZD, etc.)
 * @param options - Privacy options
 * @returns Formatted currency string or masked value
 */
export function formatCurrencyWithDecimalsPrivate(
  value: number, 
  currency: string, 
  options: PrivacyOptions
): string {
  if (options.isDataMasked && value !== 0) {
    return currency === 'USD' ? 'US$***' : '$***'
  }
  return baseCurrencyWithDecimals(value, currency)
}

/**
 * Format number with privacy masking
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places
 * @param options - Privacy options
 * @returns Formatted number string or masked value
 */
export function formatNumberPrivate(
  value: number, 
  decimals: number = 0, 
  options: PrivacyOptions
): string {
  if (options.isDataMasked && value !== 0) {
    return decimals > 0 ? '**.**' : '****'
  }
  return baseNumber(value, decimals)
}

/**
 * Format shares with privacy masking
 * @param value - The number of shares
 * @param options - Privacy options
 * @returns Formatted shares string or masked value
 */
export function formatSharesPrivate(value: number, options: PrivacyOptions): string {
  if (options.isDataMasked) {
    return '**.**'
  }
  return baseNumber(value, 2)
}

/**
 * Mask a generic string value containing numbers
 * @param value - The string value to mask
 * @param options - Privacy options
 * @returns Original string or masked version
 */
export function maskStringValue(value: string, options: PrivacyOptions): string {
  if (!options.isDataMasked) return value
  
  // Check if it's a currency string
  if (value.includes('$')) {
    return value.replace(/\$[\d,]+(\.\d+)?/g, '$*****')
  }
  
  // For other strings, mask numbers within them
  return value.replace(/\d+([.,]\d+)?/g, '****')
}