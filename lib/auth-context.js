'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email and password
  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name
        }
      }
    })
    return { data, error }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Check if product is favorited
  const isFavorited = async (productId) => {
    if (!user) return false
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
    return !!data
  }

  // Toggle favorite - FIXED
const toggleFavorite = async (productId) => {
  if (!user) return { error: 'Must be logged in' }
  
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()
  
  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    return { error, action: 'removed' }
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, product_id: productId }])
    return { error, action: 'added' }
  }
}

 
  // Get user's favorites - FIXED
const getFavorites = async () => {
  if (!user) return []
  
  try {
    // First, get the favorite IDs
    const { data: favoritesData, error: favError } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id)
    
    if (favError) throw favError
    
    if (!favoritesData || favoritesData.length === 0) {
      return []
    }
    
    // Get the product IDs
    const productIds = favoritesData.map(fav => fav.product_id)
    
    // Then get the actual products
    const { data: productsData, error: productError } = await supabase
      .from('products')
      .select('*, dispensaries(name, distance_miles)')
      .in('id', productIds)
    
    if (productError) throw productError
    
    return productsData || []
    
  } catch (error) {
    console.error('Error getting favorites:', error)
    return []
  }
}

  
  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isFavorited,      
    toggleFavorite,   
    getFavorites      
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}