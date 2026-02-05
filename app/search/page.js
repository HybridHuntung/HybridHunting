'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'
import Link from 'next/link'
// In app/search/page.js, add this component
function SearchNav() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <nav className="px-6 py-4 border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[#2A2A2A]">
          HybridHunting
        </Link>
        
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/search" className="text-[#2A2A2A] hover:underline">Deals</Link>
          
          {/* Desktop: FavoritesBadge in nav */}
          <div className="hidden md:block relative group">
            <FavoritesBadge />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              View your saved favorites
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          <Link href="#" className="text-[#2A2A2A] hover:underline">How It Works</Link>
          
          {/* Mobile: Simple text link */}
          <div className="md:hidden">
            <Link href="/favorites" className="text-[#2A2A2A] hover:underline flex items-center gap-1">
              <span>❤️</span>
              <span>Favorites</span>
            </Link>
          </div>
          
          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 md:px-6 md:py-2 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
export default function SearchPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minTHC: '',
    strainType: '',
    sortBy: 'effective_price'
  })

  // Load products on page load and filter changes
  useEffect(() => {
    fetchProducts()
  }, [filters])

  async function fetchProducts() {
    setLoading(true)
    
    let query = supabase
      .from('products')
      .select('*, dispensaries(name, distance_miles)')
    
    // Apply filters
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.minPrice) query = query.gte('price', filters.minPrice)
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
    if (filters.minTHC) query = query.gte('thc_percentage', filters.minTHC)
    if (filters.strainType) query = query.eq('strain_type', filters.strainType)
    
    const { data, error } = await query
    
    if (!error && data) {
      // Calculate effective price for deals
      const productsWithEffectivePrice = data.map(product => {
        let effectivePrice = product.price
        let savings = 0
        
        if (product.deal_type === 'bundle' && product.deal_quantity > 1) {
          effectivePrice = product.deal_total_price / product.deal_quantity
          savings = ((product.price - effectivePrice) / product.price) * 100
        } else if (product.deal_type === 'discount' && product.deal_total_price) {
          effectivePrice = product.deal_total_price
          savings = ((product.price - effectivePrice) / product.price) * 100
        }
        
        return {
          ...product,
          effectivePrice: parseFloat(effectivePrice.toFixed(2)),
          savings: parseFloat(savings.toFixed(1))
        }
      })
      
      // Sort results
      const sorted = productsWithEffectivePrice.sort((a, b) => {
        if (filters.sortBy === 'effective_price') return a.effectivePrice - b.effectivePrice
        if (filters.sortBy === 'thc') return b.thc_percentage - a.thc_percentage
        if (filters.sortBy === 'distance') return a.dispensaries.distance_miles - b.dispensaries.distance_miles
        return 0
      })
      
      setProducts(sorted)
    }
    
    setLoading(false)
  }

  // Calculate stats
  const averagePrice = products.length > 0 
    ? (products.reduce((sum, p) => sum + p.effectivePrice, 0) / products.length).toFixed(2)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-[#C8D8C0] hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-[#2A2A2A]">
            Search Results ({products.length} products)
          </h1>
          <p className="text-gray-600 mt-2">
            Average price: <span className="font-semibold">${averagePrice}</span> per unit
          </p>
        </div>

        {/* Filters Sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h2 className="text-xl font-bold mb-6 text-[#2A2A2A]">Filters</h2>
              
              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">All Categories</option>
                    <option value="flower">Flower</option>
                    <option value="edibles">Edibles</option>
                    <option value="vapes">Vapes</option>
                    <option value="concentrates">Concentrates</option>
                    <option value="pre-roll">Pre-Rolls</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-1/2 p-3 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-1/2 p-3 border rounded-lg"
                    />
                  </div>
                </div>

                {/* THC Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min THC % {filters.minTHC && `: ${filters.minTHC}%`}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={filters.minTHC || 0}
                    onChange={(e) => setFilters({...filters, minTHC: e.target.value})}
                    className="w-full"
                  />
                </div>

                {/* Strain Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Strain Type</label>
                  <div className="flex gap-2">
                    {['', 'sativa', 'indica', 'hybrid'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilters({...filters, strainType: type})}
                        className={`px-4 py-2 rounded-lg ${filters.strainType === type 
                          ? 'bg-[#C8D8C0] text-[#2A2A2A]' 
                          : 'bg-gray-100 text-gray-700'}`}
                      >
                        {type || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="effective_price">Best Value (Price)</option>
                    <option value="thc">Highest THC</option>
                    <option value="distance">Nearest First</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={() => setFilters({
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    minTHC: '',
                    strainType: '',
                    sortBy: 'effective_price'
                  })}
                  className="w-full py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="md:w-3/4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-lg">Loading deals...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-xl text-gray-500">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition">
                    {/* Deal Badge */}
                    {product.savings > 0 && (
                      <div className="bg-[#EDBD8F] text-[#2A2A2A] px-4 py-2 font-bold">
                        Save {product.savings}%
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-[#2A2A2A] mb-2">{product.name}</h3>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category</span>
                          <span className="font-medium">{product.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">THC</span>
                          <span className="font-medium">{product.thc_percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Strain</span>
                          <span className="font-medium capitalize">{product.strain_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dispensary</span>
                          <span className="font-medium">{product.dispensaries?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distance</span>
                          <span className="font-medium">{product.dispensaries?.distance_miles || '?'} mi</span>
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-[#2A2A2A]">
                              ${product.effectivePrice}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.deal_type === 'bundle' && product.deal_quantity > 1
                                ? `${product.deal_quantity} for $${product.deal_total_price}`
                                : 'per unit'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Add favorite button */}
                            <FavoriteButton productId={product.id} />
      
                            <button className="px-6 py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90">
                              View Deal
                            </button>
                         </div>
                        </div>    
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}