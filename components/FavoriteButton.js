'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function FavoriteButton({ productId, size = 'md' }) {
  const { user, isFavorited: checkFavorited, toggleFavorite } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check initial favorite status
  useEffect(() => {
    if (user) {
      checkFavorited(productId).then(setIsFavorite)
    }
  }, [user, productId, checkFavorited])

  const handleClick = async () => {
    if (!user) {
      // Could trigger login modal here
      alert('Please sign in to save favorites')
      return
    }
    
    setLoading(true)
    const { error } = await toggleFavorite(productId)
    if (!error) {
      setIsFavorite(!isFavorite)
    }
    setLoading(false)
  }

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizes[size]} flex items-center justify-center rounded-full hover:scale-110 transition-all ${
        isFavorite 
          ? 'bg-red-500 text-white' 
          : 'bg-white/80 text-gray-500 hover:bg-white'
      }`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <span className="text-xs">...</span>
      ) : isFavorite ? (
        <span className="text-lg">❤️</span>
      ) : (
        <span className="text-lg">🤍</span>
      )}
    </button>
  )
}