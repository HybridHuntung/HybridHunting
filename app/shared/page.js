'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Create a separate component that uses useSearchParams
function SharedFavoritesContent() {
  const searchParams = useSearchParams()
  const favoriteIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)) || []
  const userId = searchParams.get('user') || 'anonymous'
  
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (favoriteIds.length > 0) {
      loadSharedFavorites()
    }
  }, [favoriteIds])

  async function loadSharedFavorites() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, dispensaries(name)')
        .in('id', favoriteIds)
        .limit(20) // Safety limit
      
      if (error) throw error
      setFavorites(data || [])
    } catch (err) {
      setError('Failed to load shared favorites')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* ... rest of your existing JSX ... */}
      {/* KEEP ALL YOUR EXISTING JSX HERE */}
    </div>
  )
}

// Main component with Suspense wrapper
export default function SharedFavoritesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading shared favorites...</div>
        </div>
      </div>
    }>
      <SharedFavoritesContent />
    </Suspense>
  )
}