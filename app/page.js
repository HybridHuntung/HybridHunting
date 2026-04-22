'use client'
import Image from 'next/image';
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '../components/AuthModal'
import UserMenu from '../components/UserMenu'
import FavoritesBadge from '@/components/FavoritesBadge';
import LocationDetector from '@/components/LocationDetector';
import Link from 'next/link';


export default function Home() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  
  const categories = [
    { 
      bg: 'bg-[#C9D8BE]', 
      label: 'Flower', 
      emoji: '🌿',
      description: 'Traditional cannabis buds. Available in sativa (energizing), indica (relaxing), and hybrid (balanced) strains.',
      searchTerm: 'flower'
    },
    { 
      bg: 'bg-[#F8E5CB]', 
      label: 'Edibles', 
      emoji: '🍬',
      description: 'Food and drinks infused with cannabis. Effects take 30-90 minutes to onset and last longer than smoking.',
      searchTerm: 'edibles'
    },
    { 
      bg: 'bg-[#E4AD85]', 
      label: 'Vapes', 
      emoji: '💨',
      description: 'Concentrated cannabis oil in cartridges. Fast-acting, discreet, and available in many strains.',
      searchTerm: 'vapes'
    },
    { 
      bg: 'bg-[#E2CDB7]', 
      label: 'Concentrates', 
      emoji: '⚗️',
      description: 'Potent cannabis extracts like wax, shatter, and live resin. Higher THC content than flower.',
      searchTerm: 'concentrates'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* --- 1. MOBILE-FRIENDLY NAVIGATION --- */}
      <nav className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-[#2A2A2A]">HybridHunting</div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-[#2A2A2A] hover:underline">Deals</Link>
            <Link href="/favorites" className="text-[#2A2A2A] hover:underline">Favorites</Link>
            <a href="#" className="text-[#2A2A2A] hover:underline">How It Works</a>
            <div className="flex items-center gap-4">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Layout: Sign In button ALWAYS visible + hamburger for other links */}
          <div className="flex items-center gap-3 md:hidden">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 text-sm"
              >
                Sign In
              </button>
            )}
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t flex flex-col gap-3">
            <Link href="/search" className="text-[#2A2A2A] hover:underline py-2" onClick={() => setMobileMenuOpen(false)}>Deals</Link>
            <Link href="/favorites" className="text-[#2A2A2A] hover:underline py-2" onClick={() => setMobileMenuOpen(false)}>Favorites</Link>
            <a href="#" className="text-[#2A2A2A] hover:underline py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* --- 2. HERO SECTION with Warm Cream Background --- */}
      <section className="bg-[#FCF0E4] px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* The main green box WITH SEARCH BAR */}
          <div className="bg-[#C8D8C0] rounded-2xl md:rounded-3xl p-6 md:p-10 mb-8 md:mb-12 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-[#2A2A2A] mb-3 md:mb-4">
              Hunt for the best dispensary deals in Las Vegas
            </h1>
            <p className="text-base md:text-xl text-[#2A2A2A] mb-6 md:mb-8">Compare prices, find bundles, and save instantly.</p>

            {/* SEARCH BAR */}
            <form action="/search" method="GET" className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-0 mb-6 md:mb-8">
              <input
                type="text"
                name="q"
                placeholder="Search for flower, edibles, brands..."
                className="flex-grow px-4 md:px-6 py-3 md:py-4 rounded-lg sm:rounded-l-2xl sm:rounded-r-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EDBD8F] text-sm md:text-base"
              />
              <button
                type="submit"
                className="px-6 md:px-8 py-3 md:py-4 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg sm:rounded-r-2xl sm:rounded-l-none hover:opacity-90 transition text-sm md:text-base"
              >
                Search Deals
              </button>
            </form>
            
            <p className="text-xs md:text-sm text-gray-700">
              Try "Hybrid Flower" or "3.5g deals"
            </p>

            <div className="max-w-2xl mx-auto mt-6 md:mt-8">
              <LocationDetector />
            </div>
          </div>

          {/* Category Cards with Expand/Collapse */}
          <div className="w-full">
            <div className="max-w-6xl mx-auto px-2 md:px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    {/* Card - click to expand/collapse */}
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === item.label ? null : item.label)}
                      className={`${item.bg} rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-row sm:flex-col items-center text-center gap-4 sm:gap-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer w-full`}
                    >
                      <div className="h-12 w-12 sm:h-20 sm:w-20 bg-white/30 rounded-xl flex items-center justify-center">
                        <div className="text-2xl sm:text-3xl">{item.emoji}</div>
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <h3 className="text-base sm:text-xl font-bold text-[#2A2A2A]">{item.label}</h3>
                        <p className="hidden sm:block text-[#2A2A2A] mt-2 text-sm">
                          Click to learn more
                        </p>
                      </div>
                    </button>
                    
                    {/* Expanded info panel */}
                    {expandedCategory === item.label && (
                      <div className={`mt-2 p-4 ${item.bg} rounded-xl transition-all duration-300`}>
                        <p className="text-[#2A2A2A] text-sm md:text-base mb-4">
                          {item.description}
                        </p>
                        <Link
                          href={`/search?category=${item.searchTerm}`}
                          className="inline-block px-4 py-2 bg-white/50 text-[#2A2A2A] font-bold rounded-lg hover:bg-white/70 transition text-sm"
                        >
                          Browse {item.label} Deals →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. "ELEVATE & RELAX" Terracotta Section --- */}
      <section className="bg-[#EDBD8F] px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-[#2A2A2A] mb-4 md:mb-6">Elevate & Relax</h2>
          <p className="text-base md:text-xl text-[#2A2A2A] mb-8 md:mb-12">
            Discover curated products to match your vibe.
          </p>
          <div className="bg-white/40 rounded-2xl md:rounded-3xl p-6 md:p-10 max-w-2xl mx-auto">
            <div className="text-4xl md:text-6xl mb-4 md:mb-6">🌿</div>
            <h3 className="text-xl md:text-3xl font-bold text-[#2A2A2A] mb-2 md:mb-4">Featured Product</h3>
            <p className="text-sm md:text-lg text-[#2A2A2A]">A premium selection to help you unwind.</p>
          </div>
        </div>
      </section>

      {/* --- 4. FOOTER with Light Peach Background --- */}
      <footer className="bg-[#F5D9C0] px-4 md:px-6 py-12 md:py-16 rounded-t-2xl md:rounded-t-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-[#2A2A2A] mb-6 md:mb-10">Ready to start hunting?</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8 md:mb-12">
            <a href="#" className="text-base md:text-xl text-[#2A2A2A] hover:underline">Deals</a>
            <a href="#" className="text-base md:text-xl text-[#2A2A2A] hover:underline">How It Works</a>
            <a href="#" className="text-base md:text-xl text-[#2A2A2A] hover:underline">About</a>
            <a href="#" className="text-base md:text-xl text-[#2A2A2A] hover:underline">Contact</a>
          </div>
          <button className="bg-[#C8D8C0] text-[#2A2A2A] font-bold px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl hover:opacity-90">
            Find Deals
          </button>
          <p className="mt-8 md:mt-12 text-sm md:text-base text-[#2A2A2A]">
            © 2026 HybridHunting. For legal use in Nevada. Consume responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}