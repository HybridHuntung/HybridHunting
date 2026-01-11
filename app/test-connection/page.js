'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState('Testing...')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function test() {
      try {
        const { data, error } = await supabase
          .from('dispensaries')
          .select('*')
          .limit(1)
        
        if (error) {
          setError(error.message)
          setStatus('Failed ❌')
        } else {
          setData(data)
          setStatus(`Success! Found ${data?.length} dispensaries ✅`)
        }
      } catch (err) {
        setError(err.message)
        setStatus('Failed ❌')
      }
    }
    
    test()
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="mb-6 p-4 rounded-lg bg-gray-100">
        <h2 className="text-xl font-semibold mb-2">Status: {status}</h2>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="font-medium text-red-800">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>

      {data && (
        <div>
          <h3 className="text-lg font-medium mb-2">Sample Data:</h3>
          <pre className="p-4 bg-gray-800 text-gray-100 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}