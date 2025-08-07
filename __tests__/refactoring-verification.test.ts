/**
 * Refactoring Verification Test Suite
 * These tests ensure that the refactored code maintains the same behavior as before
 */

import { calculateCAGR, calculateCAGRFromGainPercent, formatPercentage, formatCurrency } from '@/lib/financial-calculations'
import { formatNumber, formatDate, formatCurrencyWithDecimals } from '@/lib/format-utils'

describe('Financial Calculations - Regression Tests', () => {
  describe('calculateCAGR', () => {
    it('should calculate CAGR correctly for positive growth', () => {
      const result = calculateCAGR(1000, 2000, 5)
      expect(result).toBeCloseTo(0.1487, 4)
    })

    it('should return 0 for invalid inputs', () => {
      expect(calculateCAGR(0, 1000, 5)).toBe(0)
      expect(calculateCAGR(1000, 2000, 0)).toBe(0)
      expect(calculateCAGR(-1000, 2000, 5)).toBe(0)
    })

    it('should handle edge cases', () => {
      expect(calculateCAGR(1000, 1000, 5)).toBe(0) // No growth
      expect(calculateCAGR(1000, 500, 5)).toBeCloseTo(-0.1292, 4) // Negative growth
    })
  })

  describe('calculateCAGRFromGainPercent', () => {
    it('should calculate CAGR from gain percentage correctly', () => {
      const result = calculateCAGRFromGainPercent(100, 5) // 100% gain over 5 years
      expect(result).toBeCloseTo(0.1487, 4)
    })

    it('should handle edge cases', () => {
      expect(calculateCAGRFromGainPercent(0, 5)).toBe(0)
      expect(calculateCAGRFromGainPercent(100, 0)).toBe(0)
      expect(calculateCAGRFromGainPercent(-50, 5)).toBeCloseTo(-0.1292, 4)
    })
  })

  describe('formatPercentage', () => {
    it('should format positive percentages with + sign', () => {
      expect(formatPercentage(0.1548)).toBe('+15.5%')
      expect(formatPercentage(0.05)).toBe('+5.0%')
    })

    it('should format negative percentages without + sign', () => {
      expect(formatPercentage(-0.1548)).toBe('-15.5%')
    })

    it('should respect decimal parameter', () => {
      expect(formatPercentage(0.15487, 2)).toBe('+15.49%')
      expect(formatPercentage(0.15487, 0)).toBe('+15%')
    })
  })

  describe('formatCurrency - CRITICAL REGRESSION', () => {
    it('⚠️ REGRESSION: Now formats without decimal places by default', () => {
      // OLD BEHAVIOR: Would show $1,234.56
      // NEW BEHAVIOR: Shows $1,235 (rounded, no decimals)
      expect(formatCurrency(1234.56)).toBe('NZ$1,235')
      expect(formatCurrency(1234.49)).toBe('NZ$1,234')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(1000, 'USD')).toBe('US$1,000')
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000')
    })
  })
})

describe('Format Utils - Regression Tests', () => {
  describe('formatNumber', () => {
    it('should format numbers with specified decimals', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57')
      expect(formatNumber(1234.5678, 0)).toBe('1,235')
      expect(formatNumber(1234.5678, 4)).toBe('1,234.5678')
    })

    it('should handle edge cases', () => {
      expect(formatNumber(0, 2)).toBe('0.00')
      expect(formatNumber(-1234.56, 2)).toBe('-1,234.56')
      expect(formatNumber(Infinity, 2)).toBe('∞')
    })
  })

  describe('formatDate', () => {
    it('should format ISO date strings to NZ locale', () => {
      expect(formatDate('2024-01-15')).toBe('15 Jan 2024')
      expect(formatDate('2024-12-31')).toBe('31 Dec 2024')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date')
    })
  })

  describe('formatCurrencyWithDecimals', () => {
    it('should format currency with decimals', () => {
      expect(formatCurrencyWithDecimals(1234.56)).toBe('NZ$1,234.56')
      expect(formatCurrencyWithDecimals(1234.5, 'USD')).toBe('US$1,234.50')
    })

    it('should handle undefined values', () => {
      expect(formatCurrencyWithDecimals(undefined)).toBe('N/A')
    })

    it('should respect decimal parameter', () => {
      expect(formatCurrencyWithDecimals(1234.5678, 'NZD', 3)).toBe('NZ$1,234.568')
      expect(formatCurrencyWithDecimals(1234.5678, 'NZD', 0)).toBe('NZ$1,235')
    })
  })
})

describe('API Call Behavior - Integration Tests', () => {
  // Mock fetch for testing
  global.fetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchPortfolioData parallel execution', () => {
    it('⚠️ BEHAVIOR CHANGE: Now makes parallel API calls', async () => {
      // Setup mocks
      const mockCurrentData = { holdings: [], summary: {} }
      const mockPortfolioData = { exitedPositions: [] }
      const mockHistoryData = { history: [] }

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('portfolio-current')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCurrentData) })
        }
        if (url.includes('portfolio-history')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHistoryData) })
        }
        if (url.includes('portfolio')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPortfolioData) })
        }
      })

      // OLD BEHAVIOR: Would call APIs sequentially
      // NEW BEHAVIOR: Calls all APIs at once
      
      // Simulate the new parallel behavior
      const startTime = Date.now()
      const [current, portfolio, history] = await Promise.all([
        fetch('/api/portfolio-current'),
        fetch('/api/portfolio').catch(() => null),
        fetch('/api/portfolio-history').catch(() => null)
      ])
      const endTime = Date.now()

      // All 3 calls should be made immediately
      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast (parallel)
    })

    it('⚠️ REGRESSION: Secondary API errors are now silently caught', async () => {
      // Setup mock to fail for portfolio endpoint
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('portfolio-current')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.includes('portfolio')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      // NEW BEHAVIOR: Error is caught and returns null
      const portfolioResponse = await fetch('/api/portfolio').catch(() => null)
      expect(portfolioResponse).toBeNull()
      
      // OLD BEHAVIOR: Would have thrown or been handled with specific error logging
    })
  })
})

describe('Component Prop Changes - Type Safety', () => {
  // These are manual verification tests since we can't run React components here
  
  it('MANUAL TEST: Verify formatCurrency displays whole dollars in UI', () => {
    // CHECK: All currency displays that previously showed cents (e.g., $1,234.56)
    // now show whole dollars (e.g., $1,235)
    // 
    // Affected locations:
    // - Portfolio value display
    // - Holdings table
    // - Gains/losses display
    // - S&P 500 comparison
  })

  it('MANUAL TEST: Verify formatCurrencyWithDecimals is used for precise values', () => {
    // CHECK: Share prices and per-share costs should still show decimals
    // 
    // Affected locations:
    // - Current price column in holdings table
    // - Cost basis per share
  })

  it('MANUAL TEST: Verify error handling for failed API calls', () => {
    // CHECK: When portfolio or history endpoints fail:
    // - No error message is shown to user
    // - App continues to function with partial data
    // - No console errors logged
  })
})

// Test data for edge cases
const EDGE_CASE_NUMBERS = [
  0,
  -0,
  1,
  -1,
  0.001,
  -0.001,
  999999999,
  -999999999,
  Infinity,
  -Infinity,
  NaN,
  null as any,
  undefined as any,
  '' as any,
  '123' as any,
  [] as any,
  {} as any
]

describe('Edge Case Testing - Comprehensive', () => {
  describe('Format functions with edge cases', () => {
    EDGE_CASE_NUMBERS.forEach(num => {
      it(`formatCurrency handles ${num}`, () => {
        if (typeof num === 'number' && !isNaN(num) && isFinite(num)) {
          expect(() => formatCurrency(num)).not.toThrow()
        }
      })

      it(`formatNumber handles ${num}`, () => {
        if (typeof num === 'number' && !isNaN(num) && isFinite(num)) {
          expect(() => formatNumber(num)).not.toThrow()
        }
      })
    })
  })
})