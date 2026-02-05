import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import FloatingFavoritesButton from '@/components/FloatingFavoritesButton'

export const metadata = {
  title: 'HybridHunting - Find Dispensary Deals',
  description: 'Compare prices and find the best cannabis deals in Las Vegas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <FloatingFavoritesButton />
        </AuthProvider>
      </body>
    </html>
  )
}
