'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

export default function FavoritesPage() {
  const { user, getFavorites } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  async function loadFavorites() {
    setLoading(true)
    const favs = await getFavorites()
    setFavorites(favs)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Your Favorites</h1>
          <p className="text-gray-600 mb-8">Please sign in to view your saved deals.</p>
          <Link 
            href="/" 
            className="px-6 py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#C8D8C0] hover:underline">
            ← Back to Search
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-[#2A2A2A]">
            Your Favorites ({favorites.length})
          </h1>
          <p className="text-gray-600 mt-2">
            Deals you've saved for later
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg">Loading your favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-6xl mb-6">🤍</div>
            <h2 className="text-2xl font-bold mb-4">No favorites yet</h2>
            <p className="text-gray-600 mb-8">
              Start saving deals by clicking the heart icon on any product.
            </p>
            <Link 
              href="/search" 
              className="px-6 py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
            >
              Browse Deals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-[#2A2A2A]">{product.name}</h3>
                    <FavoriteButton productId={product.id} size="sm" />
                  </div>
                  
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
                      ${product.effectivePrice || product.price}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {product.deal_type === 'bundle' && product.deal_quantity > 1
                          ? `${product.deal_quantity} for $${product.deal_total_price}`
                          : 'per unit'}
                      </span>
                    </div>
                    <button className="w-full py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90">
                      View Deal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}