'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function FloatingFavoritesButton() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Detect mobile and handle scroll
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    
    // Hide on scroll down, show on scroll up
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('resize', checkMobile)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  // Get favorites count
  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    fetchCount()

    // Subscribe to changes
    const channel = supabase
      .channel('favorites-floating')
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

  // Only show on mobile for logged-in users
  if (!user || !isMobile) return null

  return (
    <Link
      href="/favorites"
      className={`
        fixed z-40 flex items-center justify-center
        transition-all duration-300 ease-in-out
        ${isVisible ? 'bottom-6 opacity-100' : 'bottom-[-100px] opacity-0'}
        right-6 w-14 h-14 bg-[#C8D8C0] text-[#2A2A2A]
        rounded-full shadow-lg hover:shadow-xl
        hover:scale-110 active:scale-95
      `}
      aria-label={`Favorites (${count} items)`}
    >
      <div className="relative">
        <span className="text-2xl">❤️</span>
        {count > 0 && (
          <span className="
            absolute -top-2 -right-2
            bg-[#EDBD8F] text-[#2A2A2A] text-xs font-bold
            rounded-full w-6 h-6 flex items-center justify-center
            border-2 border-white
          ">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
    </Link>
  )
}