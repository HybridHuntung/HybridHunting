'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!user) return null

  // Get display name: full_name → name → email username
  const displayName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0]
  
  // Get initial for avatar: from name, not email
  const displayInitial = (user.user_metadata?.full_name?.[0] || 
                        user.user_metadata?.name?.[0] || 
                        user.email?.[0] || 'U').toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8D8C0] text-[#2A2A2A] hover:opacity-90"
      >
        {/* Avatar with name initial */}
        <div className="w-8 h-8 rounded-full bg-[#EDBD8F] flex items-center justify-center font-medium">
          {displayInitial}
        </div>
        
        {/* Display name (hide on very small screens) */}
        <span className="hidden sm:inline font-medium">
          {displayName}
        </span>
      </button>

      {/* Dropdown - also update the display here */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b">
              {/* Show full name prominently */}
              {user.user_metadata?.full_name || user.user_metadata?.name ? (
                <>
                  <p className="font-medium">
                    {user.user_metadata.full_name || user.user_metadata.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </>
              ) : (
                <p className="font-medium truncate">{user.email}</p>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  signOut()
                  setShowDropdown(false)
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}