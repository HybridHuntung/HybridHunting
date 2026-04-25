'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consented = localStorage.getItem('hybridhunting-cookie-consent')
    if (!consented) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem('hybridhunting-cookie-consent', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-center sm:text-left">
          We use cookies to improve your experience and remember your preferences.
        </p>
        <button
          onClick={accept}
          className="bg-[#C8D8C0] text-[#2A2A2A] px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition whitespace-nowrap"
        >
          Accept Cookies
        </button>
      </div>
    </div>
  )
}