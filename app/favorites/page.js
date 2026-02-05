'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'
import { supabase } from '@/lib/supabase'

export default function FavoritesPage() {
  const { user, getFavorites } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  async function loadFavorites() {
    setLoading(true)
    const favs = await getFavorites()
    setFavorites(favs)
    setSelectedItems(new Set()) // Clear selections when favorites reload
    setLoading(false)
  }

const shareFavorites = async () => {
  if (!user) {
    alert('Please sign in to share favorites')
    return
  }

   const favoritesToShare = favorites.filter(f => selectedItems.has(f.id))

  if (favoritesToShare.length === 0) {
    alert('No favorites to share')
    return
  }

  // Create share data
  const favoriteIds = favoritesToShare.map(f => f.id).join(',')
  const shareData = {
    title: 'My HybridHunting Favorites',
    text: `Check out these ${favoritesToShare.length} cannabis deals I found!`,
    url: `${window.location.origin}/shared?ids=${favoriteIds}&user=${user.id.slice(0, 8)}`
  }

  // Try Web Share API (mobile/Chrome)
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('Web Share failed, falling back to clipboard')
      }
    }
  }

  // Fallback: Copy link to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url)
    alert('Share link copied to clipboard! Send it to friends.')
  } catch (err) {
    // Final fallback: Show URL
    prompt('Copy this link to share:', shareData.url)
  }
}

  // Toggle selection of a favorite
  const toggleSelection = (productId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedItems(newSelected)
  }

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedItems.size === favorites.length) {
      setSelectedItems(new Set())
    } else {
      const allIds = new Set(favorites.map(f => f.id))
      setSelectedItems(allIds)
    }
  }

  // Clear selected favorites
  const clearSelected = async () => {
    if (!user || selectedItems.size === 0) return
    
    setBulkActionLoading(true)
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .in('product_id', Array.from(selectedItems))
      
      if (error) throw error
      
      // Reload favorites
      await loadFavorites()
      alert(`Removed ${selectedItems.size} item(s) from favorites`)
      
    } catch (error) {
      console.error('Error clearing favorites:', error)
      alert('Failed to remove items. Please try again.')
    } finally {
      setBulkActionLoading(false)
    }
  }

 
  // Export favorites as text
  const exportFavorites = () => {
    const selectedFavorites = favorites.filter(f => selectedItems.has(f.id))
    const favoritesToExport = selectedItems.size > 0 ? selectedFavorites : favorites
    
    if (favoritesToExport.length === 0) {
      alert('No favorites to export')
      return
    }
    
    let exportText = `HybridHunting Favorites (${new Date().toLocaleDateString()})\n`
    exportText += '='.repeat(40) + '\n\n'
    
    favoritesToExport.forEach((fav, index) => {
      exportText += `${index + 1}. ${fav.name}\n`
      exportText += `   Dispensary: ${fav.dispensaries?.name || 'Unknown'}\n`
      exportText += `   Price: $${fav.price}\n`
      exportText += `   THC: ${fav.thc_percentage}%\n`
      exportText += `   Category: ${fav.category}\n`
      
      if (fav.deal_type === 'bundle' && fav.deal_quantity > 1) {
        exportText += `   Deal: ${fav.deal_quantity} for $${fav.deal_total_price}\n`
      }
      
      exportText += '\n'
    })
    
    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hybridhunting-favorites-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert(`Exported ${favoritesToExport.length} favorite(s)`)
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
        {/* Header with Bulk Actions */}
        <div className="mb-8">
          <Link href="/" className="text-[#C8D8C0] hover:underline">
            ← Back to Home
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2A2A2A]">
                Your Favorites ({favorites.length})
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedItems.size > 0 
                  ? `${selectedItems.size} item(s) selected`
                  : 'Deals youve saved for later'}
              </p>
            </div>
            
            {/* Bulk Action Buttons */}
            {favorites.length > 0 && (
  <div className="flex flex-wrap gap-3">
    <button
      onClick={toggleSelectAll}
      disabled={loading || bulkActionLoading}
      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
    >
      {selectedItems.size === favorites.length ? 'Deselect All' : 'Select All'}
    </button>
    
    {selectedItems.size > 0 && (
      <button
        onClick={clearSelected}
        disabled={bulkActionLoading}
        className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
      >
        {bulkActionLoading ? 'Removing...' : `Remove Selected (${selectedItems.size})`}
      </button>
    )}
  </div>
)}

 {/* Share Button */}
    <button
          onClick={shareFavorites}
          disabled={bulkActionLoading}
          className="px-4 py-2 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          <span>📤</span>
          Share ({selectedItems.size})
        </button>
  </div>
)

          </div>
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
          <>
            {/* Selection Summary Bar */}
            {selectedItems.size > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                <span className="text-blue-800 font-medium">
                  {selectedItems.size} item(s) selected
                </span>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear selection
                </button>
              </div>
            )}
            
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(product => {
                const isSelected = selectedItems.has(product.id)
                
                return (
                  <div 
                    key={product.id} 
                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-[#C8D8C0] ring-offset-2' : ''
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="p-4 border-b flex justify-between items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(product.id)}
                          className="w-5 h-5 text-[#C8D8C0] rounded border-gray-300 focus:ring-[#C8D8C0]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </label>
                      <FavoriteButton productId={product.id} size="sm" />
                    </div>
                    
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
                )
              })}
            </div>
          </>
        )}
      </div>
  )
}