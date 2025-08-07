/**
 * Calculate Compound Annual Growth Rate (CAGR)
 * 
 * CAGR represents the mean annual growth rate of an investment over a specified period of time.
 * It assumes the investment compounds over time.
 * 
 * @param initialValue - Starting value of the investment (must be positive)
 * @param finalValue - Ending value of the investment
 * @param years - Number of years over which the growth occurred (must be positive)
 * @returns CAGR as a decimal (e.g., 0.15 for 15% annual growth)
 * 
 * @example
 * // Calculate CAGR for an investment that grew from $1000 to $2000 over 5 years
 * const cagr = calculateCAGR(1000, 2000, 5)
 * console.log(cagr) // 0.1487 (14.87% annual growth)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0
  return Math.pow(finalValue / initialValue, 1 / years) - 1
}

/**
 * Calculate CAGR from gain percentage
 * @param gainPercent Total gain percentage
 * @param years Number of years
 * @returns CAGR as a decimal
 */
export function calculateCAGRFromGainPercent(gainPercent: number, years: number): number {
  if (years <= 0) return 0
  return Math.pow(1 + gainPercent / 100, 1 / years) - 1
}

/**
 * Format percentage for display
 * @param value Decimal value (e.g., 0.15 for 15%)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const percentage = value * 100
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(decimals)}%`
}

/**
 * Format currency value
 * @param value Numeric value
 * @param currency Currency code
 * @param locale Locale string
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'NZD', locale: string = 'en-NZ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}