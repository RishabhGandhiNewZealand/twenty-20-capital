// Performance monitoring utility for tracking app performance

import React, { useEffect } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()

  // Track component render time
  measureRenderTime(componentName: string, callback: () => void): void {
    const startTime = performance.now()
    callback()
    const endTime = performance.now()
    
    this.recordMetric({
      name: `${componentName}_render_time`,
      value: endTime - startTime,
      unit: 'ms',
      timestamp: Date.now()
    })
  }

  // Track API call performance
  async measureApiCall<T>(
    apiName: string, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      
      this.recordMetric({
        name: `${apiName}_response_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const endTime = performance.now()
      
      this.recordMetric({
        name: `${apiName}_error_response_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now()
      })
      
      throw error
    }
  }

  // Track memory usage (if available)
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      
      this.recordMetric({
        name: 'js_heap_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: Date.now()
      })
      
      this.recordMetric({
        name: 'js_heap_limit',
        value: memory.jsHeapSizeLimit,
        unit: 'bytes',
        timestamp: Date.now()
      })
    }
  }

  // Track long tasks
  observeLongTasks(): void {
    if ('PerformanceObserver' in window && !this.observers.has('longtask')) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now()
            })
            
            console.warn(`Long task detected: ${entry.duration}ms`, entry)
          }
        })
        
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', observer)
      } catch (error) {
        console.debug('Long task observer not supported')
      }
    }
  }

  // Track largest contentful paint
  observeLCP(): void {
    if ('PerformanceObserver' in window && !this.observers.has('lcp')) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          
          this.recordMetric({
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now()
          })
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', observer)
      } catch (error) {
        console.debug('LCP observer not supported')
      }
    }
  }

  // Track first input delay
  observeFID(): void {
    if ('PerformanceObserver' in window && !this.observers.has('fid')) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any
            this.recordMetric({
              name: 'first_input_delay',
              value: fidEntry.processingStart - fidEntry.startTime,
              unit: 'ms',
              timestamp: Date.now()
            })
          }
        })
        
        observer.observe({ entryTypes: ['first-input'] })
        this.observers.set('fid', observer)
      } catch (error) {
        console.debug('FID observer not supported')
      }
    }
  }

  // Record a metric
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`)
    }
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  // Get metrics summary
  getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number; values: number[] }> = {}
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          count: 0,
          values: []
        }
      }
      
      summary[metric.name].values.push(metric.value)
      summary[metric.name].count++
      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value)
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value)
    }
    
    // Calculate averages and remove values array
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    for (const [name, data] of Object.entries(summary)) {
      result[name] = {
        avg: data.values.reduce((a, b) => a + b, 0) / data.values.length,
        min: data.min,
        max: data.max,
        count: data.count
      }
    }
    
    return result
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = []
  }

  // Cleanup observers
  cleanup(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Initialize observers if in browser
if (typeof window !== 'undefined') {
  performanceMonitor.observeLongTasks()
  performanceMonitor.observeLCP()
  performanceMonitor.observeFID()
  
  // Track memory usage every 30 seconds
  setInterval(() => {
    performanceMonitor.trackMemoryUsage()
  }, 30000)
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      performanceMonitor.recordMetric({
        name: `${componentName}_mount_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now()
      })
    }
  }, [componentName])
}

// HOC for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    usePerformanceMonitor(componentName)
    return <Component {...props} />
  })
}