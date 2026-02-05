'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SharedFavoritesPage() {
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-[#C8D8C0] hover:underline inline-block mb-4">
            ← Back to HybridHunting
          </Link>
          <h1 className="text-3xl font-bold text-[#2A2A2A]">
            Shared Favorites
          </h1>
          <p className="text-gray-600 mt-2">
            {userId !== 'anonymous' ? `Shared by user ${userId}` : 'Shared cannabis deals'}
          </p>
          <div className="mt-6 p-4 bg-[#FCF0E4] rounded-lg max-w-2xl mx-auto">
            <p className="font-medium text-[#2A2A2A]">
              ✨ Like these deals? <Link href="/" className="text-[#C8D8C0] font-bold hover:underline">Create your own account</Link> to save and compare prices!
            </p>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-lg">Loading shared favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No favorites found</h2>
            <p className="text-gray-600">The shared link may be expired or invalid.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="inline-block px-6 py-3 bg-[#C8D8C0] text-[#2A2A2A] rounded-full font-bold">
                {favorites.length} shared deals
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#2A2A2A] mb-2">{product.name}</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium">{product.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">THC</span>
                        <span className="font-medium">{product.thc_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dispensary</span>
                        <span className="font-medium">{product.dispensaries?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price</span>
                        <span className="font-medium">${product.price}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <div className="text-2xl font-bold text-[#2A2A2A] mb-4">
                        ${product.price}
                      </div>
                      <Link 
                        href="/" 
                        className="block w-full text-center py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
                      >
                        View on HybridHunting →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Footer */}
            <div className="mt-12 p-8 bg-gradient-to-r from-[#FCF0E4] to-[#F5D9C0] rounded-2xl text-center">
              <h2 className="text-2xl font-bold text-[#2A2A2A] mb-4">
                Ready to find your own deals?
              </h2>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Join HybridHunting to save favorites, compare prices across dispensaries, 
                and get alerts when prices drop.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/" 
                  className="px-8 py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
                >
                  Browse Deals
                </Link>
                <Link 
                  href="/" 
                  className="px-8 py-3 bg-white text-[#2A2A2A] border border-[#C8D8C0] font-bold rounded-lg hover:bg-gray-50"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}