'use client'
import Image from 'next/image';
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '../components/AuthModal'
import UserMenu from '../components/UserMenu'
import FavoritesBadge from '@/components/FavoritesBadge';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const categories = [
    { bg: 'bg-[#C9D8BE]', label: 'Flower', image: '/images/green real leaf.png' },
    { bg: 'bg-[#F8E5CB]', label: 'Edibles', image: '/images/edible.png' },
    { bg: 'bg-[#E4AD85]', label: 'Vapes', image: '/images/pen.png' },
    { bg: 'bg-[#E2CDB7]', label: 'Concentrates', image: '/images/concentrate.png' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* --- 1. NAVIGATION --- */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold text-[#2A2A2A]">HybridHunting</div>
        <div className="flex items-center gap-6">
          <Link href="/search" className="text-[#2A2A2A] hover:underline">Deals</Link>
          <Link href="/favorites" className="text-[#2A2A2A] hover:underline">Favorites</Link>
          <a href="#" className="text-[#2A2A2A] hover:underline">How It Works</a>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* --- 2. HERO SECTION with Warm Cream Background --- */}
      <section className="bg-[#FCF0E4] px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* The main green box WITH SEARCH BAR */}
          <div className="bg-[#C8D8C0] rounded-3xl p-10 mb-12 text-center">
            <h1 className="text-4xl font-bold text-[#2A2A2A] mb-4">
              Hunt for the best dispensary deals in Las Vegas
            </h1>
            <p className="text-xl text-[#2A2A2A] mb-8">Compare prices, find bundles, and save instantly.</p>

            {/* SEARCH BAR */}
            <form action="/search" method="GET" className="max-w-2xl mx-auto flex mb-8">
              <input
                type="text"
                name="q"
                placeholder="Search for flower, edibles, brands..."
                className="flex-grow px-6 py-4 rounded-l-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EDBD8F]"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-r-2xl hover:opacity-90 transition"
              >
                Search Deals
              </button>
            </form>
            
            <p className="text-sm text-gray-700">
              Try "Hybrid Flower" or "3.5g deals"
            </p>
          </div>

          {/* The four vertical rectangles BELOW the green box - FIXED LAYOUT */}
          <div className="w-full">
            <div className="max-w-6xl mx-auto px-4">
              {/* Grid that becomes single column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((item) => (
                  <div
                    key={item.label}
                    className={`${item.bg} rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                  >
                    {/* Icon/Image placeholder */}
                    <div className="h-20 w-20 bg-white/30 rounded-xl mb-4 flex items-center justify-center">
                      {/* Use Image if available, otherwise emoji */}
                      <div className="text-3xl">
                        {item.label === 'Flower' && '🌿'}
                        {item.label === 'Edibles' && '🍬'}
                        {item.label === 'Vapes' && '💨'}
                        {item.label === 'Concentrates' && '⚗️'}
                      </div>
                    </div>
                    {/* Text - centered */}
                    <div>
                      <h3 className="text-xl font-bold text-[#2A2A2A]">
                        {item.label}
                      </h3>
                      <p className="text-[#2A2A2A] mt-2 text-sm">
                        Browse the best deals on {item.label.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div> {/* This closes the max-w-4xl container */}
      </section>

      {/* --- 3. "ELEVATE & RELAX" Terracotta Section --- */}
      <section className="bg-[#EDBD8F] px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2A2A2A] mb-6">Elevate & Relax</h2>
          <p className="text-xl text-[#2A2A2A] mb-12">
            Discover curated products to match your vibe.
          </p>
          {/* Single product placeholder - one column */}
          <div className="bg-white/40 rounded-3xl p-10 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🌿</div>
            <h3 className="text-3xl font-bold text-[#2A2A2A] mb-4">Featured Product</h3>
            <p className="text-[#2A2A2A] text-lg">A premium selection to help you unwind.</p>
          </div>
        </div>
      </section>

      {/* --- 4. FOOTER with Light Peach Background --- */}
      <footer className="bg-[#F5D9C0] px-6 py-16 rounded-t-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2A2A2A] mb-10">Ready to start hunting?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12">
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">Deals</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">How It Works</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">About</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">Contact</a>
          </div>
          <button className="bg-[#C8D8C0] text-[#2A2A2A] font-bold px-12 py-4 rounded-2xl text-xl hover:opacity-90">
            Find Deals
          </button>
          <p className="mt-12 text-[#2A2A2A]">
            © 2026 HybridHunting. For legal use in Nevada. Consume responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}