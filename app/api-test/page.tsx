"use client"

import { useEffect, useState } from "react"

export default function APITestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolio-history')
      .then(res => {
        console.log('Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Data received:', data)
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {data && (
        <div>
          <p className="mb-2">Data received successfully!</p>
          <p className="mb-2">History length: {data.history?.length || 0}</p>
          <p className="mb-2">Last updated: {data.lastUpdated}</p>
          {data.history && data.history.length > 0 && (
            <div className="mt-4">
              <p className="font-bold">First entry:</p>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(data.history[0], null, 2)}
              </pre>
              <p className="font-bold mt-4">Last entry:</p>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(data.history[data.history.length - 1], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}