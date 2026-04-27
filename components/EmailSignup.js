'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function EmailSignup({ user }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success', 'error', 'already'
  const [message, setMessage] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check subscription status on mount if user is logged in
  useEffect(() => {
    if (user?.email) {
      checkSubscriptionStatus(user.email)
    } else {
      setChecking(false)
    }
  }, [user])

  const checkSubscriptionStatus = async (emailToCheck) => {
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(emailToCheck)}`, {
        method: 'GET',
      })
      const data = await res.json()
      setIsSubscribed(data.subscribed)
    } catch (err) {
      console.error('Error checking subscription:', err)
    } finally {
      setChecking(false)
    }
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    setMessage('')

    const emailToUse = user?.email || email

    if (!emailToUse || !emailToUse.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setStatus('already')
        setMessage(data.message || 'Already subscribed.')
        setIsSubscribed(true)
      } else if (!res.ok) {
        throw new Error(data.error || 'Subscription failed')
      } else {
        setStatus('success')
        setMessage('Successfully subscribed!')
        setIsSubscribed(true)
        if (!user?.email) setEmail('')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    const emailToUse = user?.email || email

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Unsubscribe failed')

      setStatus('success')
      setMessage('Successfully unsubscribed.')
      setIsSubscribed(false)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="text-center text-sm text-gray-500">Loading...</div>
  }

  // Logged-in user already subscribed
  if (user?.email && isSubscribed) {
    return (
      <div className="text-center">
        <p className="text-sm text-green-600 mb-2">✓ You are subscribed to deal alerts</p>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="text-xs text-amber-600 hover:underline"
        >
          {loading ? 'Processing...' : 'Unsubscribe'}
        </button>
      </div>
    )
  }

  // Logged-in user not subscribed
  if (user?.email && !isSubscribed) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Get deal alerts via email</p>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-2 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg text-sm hover:opacity-90"
        >
          {loading ? 'Processing...' : 'Subscribe to Alerts'}
        </button>
        {status === 'error' && <p className="text-xs text-red-500 mt-2">{message}</p>}
        {status === 'already' && (
          <p className="text-xs text-amber-600 mt-2">
            {message}{' '}
            <button onClick={handleUnsubscribe} className="underline">
              Unsubscribe
            </button>
          </p>
        )}
        {status === 'success' && <p className="text-xs text-green-600 mt-2">{message}</p>}
      </div>
    )
  }

  // Non-logged-in user - show email form
  return (
    <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
      <p className="text-sm text-gray-600 mb-2 text-center">Get deal alerts via email</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8D8C0]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg text-sm hover:opacity-90 whitespace-nowrap"
        >
          {loading ? 'Processing...' : 'Subscribe'}
        </button>
      </div>
      {status === 'success' && <p className="text-xs text-green-600 text-center mt-2">{message}</p>}
      {status === 'already' && (
        <p className="text-xs text-amber-600 text-center mt-2">
          {message}{' '}
          <button type="button" onClick={handleUnsubscribe} className="underline">
            Unsubscribe
          </button>
        </p>
      )}
      {status === 'error' && <p className="text-xs text-red-500 text-center mt-2">{message}</p>}
      <p className="text-xs text-gray-400 text-center mt-2">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  )
}