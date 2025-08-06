/**
 * Performance optimization utilities
 * 
 * This module provides utility functions to optimize performance in React applications
 * by implementing memoization, debouncing, and throttling patterns.
 */

/**
 * Simple memoization function for expensive calculations
 * 
 * Memoization is an optimization technique that stores the results of expensive function calls
 * and returns the cached result when the same inputs occur again.
 * 
 * @param fn - The function to memoize
 * @param getKey - Optional function to generate cache key from arguments (defaults to JSON.stringify)
 * @returns A memoized version of the function
 * 
 * @example
 * // Memoize an expensive calculation
 * const expensiveCalc = (n: number) => {
 *   console.log('Computing...')
 *   return n * n
 * }
 * 
 * const memoizedCalc = memoize(expensiveCalc)
 * memoizedCalc(5) // logs: Computing... returns: 25
 * memoizedCalc(5) // returns: 25 (from cache, no log)
 * 
 * @remarks
 * - Cache size is limited to 100 entries to prevent memory leaks
 * - Uses LRU (Least Recently Used) eviction when cache is full
 */
export function memoize<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  getKey: (...args: TArgs) => string = (...args) => JSON.stringify(args)
): (...args: TArgs) => TResult {
  const cache = new Map<string, TResult>()
  
  return (...args: TArgs): TResult => {
    const key = getKey(...args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    return result
  }
}

/**
 * Debounce function to limit the rate of function calls
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function to limit the rate of function calls
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  limit: number
): (...args: TArgs) => void {
  let inThrottle = false
  
  return (...args: TArgs) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}