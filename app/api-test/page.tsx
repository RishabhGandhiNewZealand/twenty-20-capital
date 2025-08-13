'use client'

import { useState } from 'react'

export default function APITestPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testAPI = async (endpoint: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error instanceof Error ? error.message : 'Failed to fetch'
        }
      }))
    }
    setLoading(false)
  }

  const testAllAPIs = async () => {
    const endpoints = [
      '/api/test-protection',
      '/api/portfolio',
      '/api/trades',
      '/api/news'
    ]
    
    for (const endpoint of endpoints) {
      await testAPI(endpoint)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Access Test</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This page tests whether the frontend can successfully call API endpoints.
        </p>
        
        <button
          onClick={testAllAPIs}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test All APIs'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <div key={endpoint} className="border rounded p-4">
            <h3 className="font-semibold mb-2">{endpoint}</h3>
            {result.error ? (
              <div className="text-red-600">Error: {result.error}</div>
            ) : (
              <div>
                <div className="text-green-600">
                  Status: {result.status} {result.ok ? '✅' : '❌'}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">View Response</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Expected Behavior:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>On <strong>rishinvests.xyz</strong>: All API calls should work (Status 200)</li>
          <li>Direct browser access to APIs should be blocked (403 with HTML error page)</li>
          <li>On preview/staging URLs: Everything should work</li>
        </ul>
      </div>
    </div>
  )
}