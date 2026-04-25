'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import Link from 'next/link'

export default function AgeGate({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUnderageMessage, setShowUnderageMessage] = useState(false)

  // Pages that should never show the age gate
  const exemptPaths = ['/terms', '/privacy']
  const isExempt = exemptPaths.includes(pathname)

  // Check verification on initial load AND when pathname changes
  useEffect(() => {
    const checkVerification = () => {
      if (isExempt) {
        setIsVerified(true)
        setIsLoading(false)
        return
      }
      
      const verified = Cookies.get('hybridhunting-age-verified')
      if (verified === 'true') {
        setIsVerified(true)
      } else {
        setIsVerified(false)
      }
      setIsLoading(false)
    }

    checkVerification()
  }, [pathname, isExempt])

  const verifyAge = () => {
    Cookies.set('hybridhunting-age-verified', 'true', { expires: null })
    setIsVerified(true)
  }

  const rejectAge = () => {
    setShowUnderageMessage(true)
  }

  const goBack = () => {
    setShowUnderageMessage(false)
  }

  // If not verified and not on exempt page, block access
  if (!isVerified && !isExempt && !isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center relative z-[60]">
          {showUnderageMessage ? (
            <>
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You are not old enough to view this site. Cannabis products are for adults 21 and older.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={goBack}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Go Back
                </button>
                <button
                  onClick={() => window.location.href = 'https://www.google.com'}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Exit to Google
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2 text-[#2A2A2A]">Age Verification</h2>
              <p className="text-gray-500 mb-6 text-sm">
                You must be 21 years or older to view cannabis deals and pricing.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={verifyAge}
                  className="flex-1 bg-[#C8D8C0] text-[#2A2A2A] font-bold py-3 rounded-lg hover:opacity-90 transition"
                >
                  I am 21 or older
                </button>
                <button
                  onClick={rejectAge}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  I am under 21
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-4 space-x-2">
                <Link href="/terms" className="underline hover:opacity-70">
                  Terms of Service
                </Link>
                <span>•</span>
                <Link href="/privacy" className="underline hover:opacity-70">
                  Privacy Policy
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return children
}