'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'
import Link from 'next/link'
import { MapPin } from 'lucide-react'


export default function SearchPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false) // NEW: for mobile filter toggle
    const [urlProcessed, setUrlProcessed] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minTHC: '',
    strainType: '',
    sortBy: 'effective_price',
    area: ''
  })

   const searchParams = useSearchParams()
  
  // Read category from URL on page load
   useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    console.log('URL category detected:', categoryFromUrl)
    if (categoryFromUrl && !urlProcessed) {
      console.log('Setting filter to:', categoryFromUrl)
      setFilters(prev => ({ ...prev, category: categoryFromUrl }))
      setUrlProcessed(true)
    }
  }, [searchParams, urlProcessed])


  // Get location from localStorage
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    const savedLocation = localStorage.getItem('hybridhunting-location')
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        if (location.isInVegas && location.selectedArea) {
          setFilters(prev => ({ ...prev, area: location.selectedArea }))
        }
      } catch (e) {
        console.error('Failed to parse location:', e)
      }
    }
  }, [])

  // Distance calculation function
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

    async function fetchProducts() {
  setLoading(true)
  
  try {
    // First get products
    let productQuery = supabase
      .from('products')
      .select('*')
    
    // Apply filters to products
    if (filters.category) productQuery = productQuery.eq('category', filters.category)
    if (filters.strainType) productQuery = productQuery.eq('strain_type', filters.strainType)
    if (filters.minPrice) productQuery = productQuery.gte('price', parseFloat(filters.minPrice))
    if (filters.maxPrice) productQuery = productQuery.lte('price', parseFloat(filters.maxPrice))
    if (filters.minTHC) productQuery = productQuery.gte('thc_percentage', parseFloat(filters.minTHC))
    
    const { data: products, error } = await productQuery
    
    if (error) throw error
    
    if (products && products.length > 0) {
      // Get all dispensary IDs from products
      const dispensaryIds = products
        .map(p => p.dispensary_id)
        .filter(id => id != null)
      
      // Fetch dispensaries separately
      let dispensaryQuery = supabase
        .from('dispensaries')
        .select('*')
      
      if (dispensaryIds.length > 0) {
        dispensaryQuery = dispensaryQuery.in('id', dispensaryIds)
      }
      
      // Filter by area if needed
      if (filters.area && filters.area !== 'All Areas') {
        dispensaryQuery = dispensaryQuery.eq('area', filters.area)
      }
      
      // Filter by state (NV)
      dispensaryQuery = dispensaryQuery.eq('state', 'NV')
      
      const { data: dispensaries } = await dispensaryQuery
      
      // Create a map of dispensary ID to dispensary data
      const dispensaryMap = {}
      dispensaries?.forEach(d => {
        dispensaryMap[d.id] = d
      })
      
      // Filter products by dispensary area if needed
      let filteredProducts = products
      if (filters.area && filters.area !== 'All Areas') {
        filteredProducts = products.filter(p => {
          const dispensary = dispensaryMap[p.dispensary_id]
          return dispensary?.area === filters.area
        })
      }
      
      // Transform products with dispensary data
      const transformedProducts = filteredProducts.map(product => {
        const dispensary = dispensaryMap[product.dispensary_id] || {}
        
        // Calculate effective price
        let effectivePrice = product.price || 0
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
          savings: parseFloat(savings.toFixed(1)),
          distance: dispensary.distance_miles || null,
          dispensaries: {
            name: dispensary.name || 'Unknown Dispensary',
            area: dispensary.area || 'Las Vegas',
            distance_miles: dispensary.distance_miles || null
          }
        }
      })
      
      // Sort products
      const sortedProducts = transformedProducts.sort((a, b) => {
        if (filters.sortBy === 'effective_price') {
          return a.effectivePrice - b.effectivePrice
        }
        if (filters.sortBy === 'thc') {
          return b.thc_percentage - a.thc_percentage
        }
        if (filters.sortBy === 'distance') {
          const distA = a.distance || 999
          const distB = b.distance || 999
          return distA - distB
        }
        return 0
      })
      
      setProducts(sortedProducts)
    } else {
      setProducts([])
    }
    
  } catch (err) {
    console.error('💥 Error:', err)
    setProducts([])
  } finally {
    setLoading(false)
  }
}


  // Helper function to calculate effective price
  function calculateEffectivePrice(product) {
    if (!product) return product.price || 0
    
    if (product.deal_type === 'bundle' && product.deal_quantity > 1) {
      return product.deal_total_price / product.deal_quantity
    } else if (product.deal_type === 'discount' && product.deal_total_price) {
      return product.deal_total_price
    }
    
    return product.price || 0
  }

  // Helper function to calculate savings
  function calculateSavings(product) {
    if (!product || !product.price) return 0
    
    const effectivePrice = calculateEffectivePrice(product)
    if (effectivePrice < product.price) {
      return Math.round(((product.price - effectivePrice) / product.price) * 100 * 10) / 10
    }
    
    return 0
  }

  // Helper for random distance (temporary)
  function calculateRandomDistance() {
    return Math.round((Math.random() * 15 + 0.5) * 10) / 10 // 0.5 to 15.5 miles
  }

  // Load products on page load and filter changes
  useEffect(() => {
    if (urlProcessed || !searchParams.get('category')) {
      console.log('Fetching products with filters:', filters)
      fetchProducts()
    }
  }, [filters, urlProcessed])

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/" className="text-[#C8D8C0] hover:underline text-sm md:text-base">
            ← Back to Home
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-bold mt-3 md:mt-4 text-[#2A2A2A]">
            {filters.area ? `${filters.area} Deals` : 'Las Vegas Deals'} 
            <span className="text-base md:text-lg font-normal text-gray-600 ml-2">
              ({products.length} products)
            </span>
          </h1>
          
          {userLocation && userLocation.isInVegas && (
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
              <p className="text-xs md:text-sm text-gray-600">
                Showing dispensaries in {filters.area || 'all Vegas areas'}
                {userLocation.detectedNeighborhood && !filters.area && 
                  ` • Detected near ${userLocation.detectedNeighborhood}`}
              </p>
            </div>
          )}
        </div>

        {/* Filters Sidebar - Mobile Collapsible */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="md:w-1/4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              {/* Mobile Filter Toggle Button */}
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="md:hidden w-full flex justify-between items-center py-2 mb-2"
              >
                <h2 className="text-lg font-bold text-[#2A2A2A]">Filters</h2>
                <span className="text-xl">{filtersOpen ? '▲' : '▼'}</span>
              </button>
              
              {/* Filter Content - Hidden on mobile unless open */}
              <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
                <h2 className="hidden md:block text-xl font-bold mb-6 text-[#2A2A2A]">Filters</h2>
                
                <div className="space-y-5 md:space-y-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
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
                        className="w-1/2 p-2.5 md:p-3 border rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="w-1/2 p-2.5 md:p-3 border rounded-lg text-sm"
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
                    <div className="flex flex-wrap gap-2">
                      {['', 'sativa', 'indica', 'hybrid'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilters({...filters, strainType: type})}
                          className={`
                            px-3 py-2 md:px-4 md:py-3 rounded-lg text-sm md:text-base
                            flex-1 text-center
                            ${filters.strainType === type 
                              ? 'bg-[#C8D8C0] text-[#2A2A2A] font-medium shadow-sm' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Area Filter */}
                  {userLocation && userLocation.isInVegas && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Vegas Area
                        </span>
                      </label>
                      <select
                        value={filters.area || ''}
                        onChange={(e) => setFilters({...filters, area: e.target.value})}
                        className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base" 
                      >
                        <option value="">All Vegas Areas</option>
                        <option value="The Strip">The Strip</option>
                        <option value="Summerlin">Summerlin</option>
                        <option value="Henderson">Henderson</option>
                        <option value="North Las Vegas">North Las Vegas</option>
                        <option value="Spring Valley">Spring Valley</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Paradise">Paradise</option>
                        <option value="Centennial Hills">Centennial Hills</option>
                        <option value="Southwest">Southwest</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Currently in: {userLocation.selectedArea || 'The Strip'}
                      </p>
                    </div>
                  )}

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                      className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
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
                      sortBy: 'effective_price',
                      area: userLocation?.isInVegas ? userLocation.selectedArea || '' : ''
                    })}
                    className="w-full py-2.5 md:py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="md:w-3/4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8D8C0] mx-auto"></div>
                <p className="mt-2 text-lg">Loading deals...</p>
                <p className="text-sm text-gray-500 mt-1">Checking Supabase database</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-xl text-gray-500 mb-4">No products found in database</p>
                <p className="text-gray-600">
                  Try adjusting your filters or check your Supabase connection
                </p>
                <button
                  onClick={() => fetchProducts()}
                  className="mt-4 px-6 py-2 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition">
                    {/* Deal Badge - Responsive */}
                    {product.savings > 0 && (
                      <div className="bg-[#EDBD8F] text-[#2A2A2A] px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-bold text-center">
                        Save {product.savings}%
                      </div>
                    )}
                    
                    <div className="p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-bold text-[#2A2A2A] mb-2">{product.name}</h3>
                      
                      <div className="space-y-2 md:space-y-3 mb-4">
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Category</span>
                          <span className="font-medium capitalize">{product.category}</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">THC</span>
                          <span className="font-medium">{product.thc_percentage}%</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Strain</span>
                          <span className="font-medium capitalize">{product.strain_type}</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Dispensary</span>
                          <span className="font-medium">{product.dispensaries?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Distance</span>
                          <span className="font-medium">
                            {product.distance ? `${product.distance} mi` : 
                            product.dispensaries?.distance_miles ? `${product.dispensaries.distance_miles} mi` : 'Distance N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="text-xl md:text-2xl font-bold text-[#2A2A2A]">
                              ${product.effectivePrice ? product.effectivePrice.toFixed(2) : product.price?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500">
                              {product.deal_type === 'bundle' && product.deal_quantity > 1
                                ? `${product.deal_quantity} for $${product.deal_total_price}`
                                : 'per unit'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <FavoriteButton productId={product.id} />
                            <button className="px-4 py-2 md:px-6 md:py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 text-sm md:text-base">
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