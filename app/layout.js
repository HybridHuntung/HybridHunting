import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { LocationProvider } from '@/lib/location-context' 
import FloatingFavoritesButton from '@/components/FloatingFavoritesButton'
import AgeGate from '@/components/AgeGate'
import CookieConsent from '@/components/CookieConsent'
import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title: 'HybridHunting - Find Dispensary Deals',
  description: 'Compare prices and find the best cannabis deals in Las Vegas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LocationProvider>
            <AgeGate>
              {children}
            </AgeGate>
            <FloatingFavoritesButton />
            <CookieConsent />
            <Analytics />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}