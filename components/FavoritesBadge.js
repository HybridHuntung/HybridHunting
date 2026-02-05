'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart } from 'lucide-react';

export default function FavoritesBadge() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    // Get initial count
    fetchCount()

    // Subscribe to changes
    const channel = supabase
      .channel('favorites-badge')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${user.id}`
      }, fetchCount)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function fetchCount() {
    if (!user) return
    
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    setCount(count || 0)
  }

  if (!user) return null

  return (
    <Link 
      href="/favorites" 
      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition group"
      title="View your saved favorites"
    >
      <span className="text-lg group-hover:scale-110 transition">❤️</span>
      <span className="font-medium hidden lg:inline">Favorites</span>
      {count > 0 && (
        <span className="bg-[#EDBD8F] text-[#2A2A2A] text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}