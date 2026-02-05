'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDB() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProducts(data || [])
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
      <p>Found {products.length} products in database</p>
      <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  )
}