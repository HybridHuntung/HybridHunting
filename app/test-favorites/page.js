'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function TestFavorites() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function test() {
      if (!user) return
      
      // Test direct query
      const { data: favs, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
      
      console.log('Favorites table query:', favs, favError)
      
      // Test with product join
      const { data: withProducts, error: joinError } = await supabase
        .from('favorites')
        .select('product_id, products(*)')
        .eq('user_id', user.id)
      
      console.log('With products join:', withProducts, joinError)
      
      setData({ favs, withProducts })
      if (favError) setError(favError.message)
      if (joinError) setError(joinError.message)
    }
    
    test()
  }, [user])

  if (!user) return <div>Please sign in</div>
  if (error) return <div className="text-red-500">Error: {error}</div>
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Favorites Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}