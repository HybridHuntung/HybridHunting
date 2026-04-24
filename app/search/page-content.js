'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'
import Link from 'next/link'

const PRODUCTS_PER_PAGE = 30

// Calculate distance between two coordinates in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function SearchContent() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [urlProcessed, setUrlProcessed] = useState(false)
  const [dispensariesList, setDispensariesList] = useState([])
  const [brandsList, setBrandsList] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [dispensarySearch, setDispensarySearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [userCoords, setUserCoords] = useState(null)
  const [useLocation, setUseLocation] = useState(true)
  const [locationDenied, setLocationDenied] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [filters, setFilters] = useState({
    categories: [],
    strainTypes: [],
    dealTypes: [],
    dispensaryIds: [],
    brands: [],
    city: '',
    minPrice: '',
    maxPrice: '',
    minTHC: '',
    sortBy: 'effective_price',
    searchKeyword: ''
  })

  const searchParams = useSearchParams()

  // Get unique cities for filter
  const uniqueCities = [...new Set(dispensariesList.map(d => d.city).filter(c => c))]

  // Load dispensaries and brands for filters
  useEffect(() => {
    async function loadFilterOptions() {
      // Load dispensaries
      const { data: dispensaries } = await supabase
        .from('dispensaries')
        .select('id, name, city, lat, lng')
        .eq('state', 'NV')
        .order('name')
      setDispensariesList(dispensaries || [])

      // Load unique brands from products
      const { data: brands } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .not('brand', 'eq', '')
      const uniqueBrands = [...new Map(brands?.map(b => [b.brand, b.brand])).values()]
      setBrandsList(uniqueBrands.sort())
    }
    loadFilterOptions()
  }, [])

  // Read parameters from URL and localStorage
useEffect(() => {
  const categoryFromUrl = searchParams.get('category')
  const cityFromUrl = searchParams.get('city')
  const useLocationFromUrl = searchParams.get('useLocation')
  const searchQueryFromUrl = searchParams.get('q')  // Add this line
  
  // Set category from URL
  if (categoryFromUrl && !urlProcessed) {
    setFilters(prev => ({ ...prev, categories: [categoryFromUrl] }))
    setUrlProcessed(true)
  }
  
  // Set search keyword from URL
  if (searchQueryFromUrl && !urlProcessed) {
    setFilters(prev => ({ ...prev, searchKeyword: searchQueryFromUrl }))
  }

  // Mark URL as processed after handling both
if ((categoryFromUrl || cityFromUrl || useLocationFromUrl || searchQueryFromUrl) && !urlProcessed) {
  setUrlProcessed(true)
}
    
    // URL parameters take precedence over localStorage
    if (useLocationFromUrl === 'true') {
      setUseLocation(true)
      setSelectedCity('')
      setFilters(prev => ({ ...prev, city: '' }))
      localStorage.setItem('hybridhunting-useLocation', 'true')
      localStorage.removeItem('hybridhunting-city')
    } 
    else if (useLocationFromUrl === 'false') {
      setUseLocation(false)
      setSelectedCity('')
      setFilters(prev => ({ ...prev, city: '' }))
      localStorage.setItem('hybridhunting-useLocation', 'false')
      localStorage.removeItem('hybridhunting-city')
    }
    else if (cityFromUrl) {
      setSelectedCity(cityFromUrl)
      setUseLocation(false)
      setFilters(prev => ({ ...prev, city: cityFromUrl }))
      localStorage.setItem('hybridhunting-useLocation', 'false')
      localStorage.setItem('hybridhunting-city', cityFromUrl)
    }
    else {
      const savedUseLocation = localStorage.getItem('hybridhunting-useLocation')
      const savedCity = localStorage.getItem('hybridhunting-city')
      
      if (savedUseLocation === 'true') {
        setUseLocation(true)
        setSelectedCity('')
        setFilters(prev => ({ ...prev, city: '' }))
      } else if (savedUseLocation === 'false') {
        setUseLocation(false)
        setSelectedCity('')
        setFilters(prev => ({ ...prev, city: '' }))
      } else if (savedCity) {
        setSelectedCity(savedCity)
        setUseLocation(false)
        setFilters(prev => ({ ...prev, city: savedCity }))
      } else {
        setUseLocation(true)
      }
    }
  }, [searchParams, urlProcessed])

  // Get user's location if enabled
  useEffect(() => {
    if (!useLocation) {
      setUserCoords(null)
      return
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationDenied(false)
        },
        (error) => {
          console.log('Location permission denied:', error)
          setLocationDenied(true)
          setUseLocation(false)
          localStorage.setItem('hybridhunting-useLocation', 'false')
        }
      )
    } else {
      setLocationDenied(true)
      setUseLocation(false)
      localStorage.setItem('hybridhunting-useLocation', 'false')
    }
  }, [useLocation])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, useLocation])

  async function fetchProducts() {
    setLoading(true)
    
    try {
      let productQuery = supabase.from('products').select('*', { count: 'exact' })
      
      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        productQuery = productQuery.in('category', filters.categories)
      }
      if (filters.strainTypes && filters.strainTypes.length > 0) {
        productQuery = productQuery.in('strain_type', filters.strainTypes)
      }
      if (filters.dealTypes && filters.dealTypes.length > 0) {
        productQuery = productQuery.in('deal_type', filters.dealTypes)
      }
      if (filters.brands && filters.brands.length > 0) {
        productQuery = productQuery.in('brand', filters.brands)
      }
      if (filters.minPrice) productQuery = productQuery.gte('price', parseFloat(filters.minPrice))
      if (filters.maxPrice) productQuery = productQuery.lte('price', parseFloat(filters.maxPrice))
      if (filters.minTHC) productQuery = productQuery.gte('thc_percentage', parseFloat(filters.minTHC))
      
      // Keyword search
      if (filters.searchKeyword && filters.searchKeyword.trim() !== '') {
        const keyword = `%${filters.searchKeyword.toLowerCase().trim()}%`
        productQuery = productQuery.or(`name.ilike.${keyword},brand.ilike.${keyword},strain_type.ilike.${keyword}`)
      }
      
      // City filter (only when not using location)
      if (!useLocation && filters.city) {
        const { data: cityDispensaries } = await supabase
          .from('dispensaries')
          .select('id')
          .eq('city', filters.city)
          .eq('state', 'NV')
        const cityDispensaryIds = cityDispensaries?.map(d => d.id) || []
        if (cityDispensaryIds.length > 0) {
          productQuery = productQuery.in('dispensary_id', cityDispensaryIds)
        }
      }
      
      // Dispensary filter
      if (filters.dispensaryIds && filters.dispensaryIds.length > 0) {
        productQuery = productQuery.in('dispensary_id', filters.dispensaryIds)
      }
      
      // Get total count
      const { count, error: countError } = await productQuery
      if (countError) throw countError
      setTotalCount(count || 0)
      
      // Apply pagination
      const start = (currentPage - 1) * PRODUCTS_PER_PAGE
      const end = start + PRODUCTS_PER_PAGE - 1
      productQuery = productQuery.range(start, end)
      
      // Apply sorting
      if (filters.sortBy === 'thc') {
        productQuery = productQuery.order('thc_percentage', { ascending: false })
      } else {
        productQuery = productQuery.order('created_at', { ascending: false })
      }
      
      const { data: products, error } = await productQuery
      if (error) throw error
      
      if (products && products.length > 0) {
        const dispensaryIds = products.map(p => p.dispensary_id).filter(id => id != null)
        
        let dispensaryQuery = supabase.from('dispensaries').select('*')
        if (dispensaryIds.length > 0) dispensaryQuery = dispensaryQuery.in('id', dispensaryIds)
        dispensaryQuery = dispensaryQuery.eq('state', 'NV')
        
        const { data: dispensaries } = await dispensaryQuery
        
        const dispensaryMap = {}
        dispensaries?.forEach(d => { dispensaryMap[d.id] = d })
        
        const transformedProducts = products.map(product => {
          const dispensary = dispensaryMap[product.dispensary_id] || {}
          let effectivePrice = product.price || 0
          let savings = 0
          
          let distance = null
          if (useLocation && userCoords && dispensary.lat && dispensary.lng) {
            distance = calculateDistance(userCoords.lat, userCoords.lng, dispensary.lat, dispensary.lng)
            distance = Math.round(distance * 10) / 10
          }
          
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
            distance: distance,
            dispensaries: {
              name: dispensary.name || 'Unknown Dispensary',
              city: dispensary.city || 'Las Vegas',
              distance_miles: distance
            }
          }
        })
        
        if (filters.sortBy === 'effective_price') {
          transformedProducts.sort((a, b) => a.effectivePrice - b.effectivePrice)
        } else if (filters.sortBy === 'distance' && useLocation) {
          transformedProducts.sort((a, b) => (a.distance || 999) - (b.distance || 999))
        }
        
        setProducts(transformedProducts)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Error:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filters, currentPage, useLocation, userCoords])

  const handleArrayFilter = (arrayName, value, checked) => {
    const currentArray = filters[arrayName] || []
    if (checked) {
      setFilters({...filters, [arrayName]: [...currentArray, value]})
    } else {
      setFilters({...filters, [arrayName]: currentArray.filter(item => item !== value)})
    }
  }

  const handleUseLocationChange = (value) => {
    setUseLocation(value)
    localStorage.setItem('hybridhunting-useLocation', value)
    if (value) {
      setFilters(prev => ({ ...prev, city: '' }))
      setSelectedCity('')
      localStorage.removeItem('hybridhunting-city')
    } else {
      if (selectedCity) {
        localStorage.setItem('hybridhunting-city', selectedCity)
      } else {
        localStorage.removeItem('hybridhunting-city')
      }
    }
  }

  const handleCityChange = (city) => {
    setSelectedCity(city)
    setFilters(prev => ({ ...prev, city: city }))
    if (city && city !== '') {
      localStorage.setItem('hybridhunting-city', city)
      localStorage.setItem('hybridhunting-useLocation', 'false')
      setUseLocation(false)
    } else {
      localStorage.removeItem('hybridhunting-city')
      localStorage.setItem('hybridhunting-useLocation', 'false')
      setUseLocation(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pageNumbers.push(i)
    } else if (pageNumbers[pageNumbers.length - 1] !== '...') {
      pageNumbers.push('...')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <Link href="/" className="text-[#C8D8C0] hover:underline text-sm md:text-base">
            ← Back to Home
          </Link>
          
          {/* Location Toggle */}
          <div className="flex items-center justify-between mt-4 mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUseLocationChange(true)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  useLocation
                    ? 'bg-[#C8D8C0] text-[#2A2A2A]'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                📍 Use My Location
              </button>
              <button
                onClick={() => handleUseLocationChange(false)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  !useLocation
                    ? 'bg-[#C8D8C0] text-[#2A2A2A]'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                🏙️ Choose City
              </button>
            </div>
            {locationDenied && (
              <p className="text-xs text-amber-600">Location access denied. Using city filter instead.</p>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mt-2 text-[#2A2A2A]">
            Las Vegas Cannabis Deals
            <span className="text-base md:text-lg font-normal text-gray-600 ml-2">
              ({totalCount} products)
            </span>
          </h1>
          
          {useLocation && userCoords && (
            <p className="text-sm text-green-600 mt-1">📍 Using your current location</p>
          )}
          {!useLocation && filters.city && (
            <p className="text-sm text-blue-600 mt-1">🏙️ Showing deals in {filters.city}</p>
          )}
          {!useLocation && !filters.city && (
            <p className="text-sm text-gray-500 mt-1">🏙️ Showing all cities</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="md:w-1/4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="md:hidden w-full flex justify-between items-center py-2 mb-2"
              >
                <h2 className="text-lg font-bold text-[#2A2A2A]">Filters</h2>
                <span className="text-xl">{filtersOpen ? '▲' : '▼'}</span>
              </button>
              
              <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
                <h2 className="hidden md:block text-xl font-bold mb-6 text-[#2A2A2A]">Filters</h2>
                
                <div className="space-y-5 md:space-y-6">
                  {/* Keyword Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Products</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by product name, brand, or strain..."
                        value={filters.searchKeyword}
                        onChange={(e) => setFilters({...filters, searchKeyword: e.target.value})}
                        className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base pr-10"
                      />
                      {filters.searchKeyword && (
                        <button
                          onClick={() => setFilters({...filters, searchKeyword: ''})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* City Filter */}
                  {!useLocation && uniqueCities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <select
                        value={filters.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
                      >
                        <option value="">All Cities</option>
                        {uniqueCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Deal Type Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Deal Type</label>
                    <div className="space-y-2 border rounded-lg p-2">
                      {[
                        { value: 'single', label: 'Single Item' },
                        { value: 'bundle', label: 'Bundle Deal' },
                        { value: 'bogo', label: 'BOGO' },
                        { value: 'discount', label: 'Percentage Discount' }
                      ].map(deal => (
                        <label key={deal.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={deal.value}
                            checked={filters.dealTypes?.includes(deal.value) || false}
                            onChange={(e) => handleArrayFilter('dealTypes', deal.value, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{deal.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                      {[
                        { value: 'flower', label: 'Flower' },
                        { value: 'pre_rolls', label: 'Pre-Rolls' },
                        { value: 'vapes', label: 'Vapes (Disposable)' },
                        { value: 'carts', label: 'Carts (Cartridges)' },
                        { value: 'concentrates', label: 'Concentrates' },
                        { value: 'edibles', label: 'Edibles' },
                        { value: 'cbd', label: 'CBD' },
                        { value: 'accessories', label: 'Accessories' },
                        { value: 'topicals', label: 'Topicals' },
                        { value: 'other', label: 'Other' }
                      ].map(cat => (
                        <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={cat.value}
                            checked={filters.categories?.includes(cat.value) || false}
                            onChange={(e) => handleArrayFilter('categories', cat.value, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{cat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Strain Type Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Strain Type</label>
                    <div className="space-y-2 border rounded-lg p-2">
                      {[
                        { value: 'sativa', label: 'Sativa' },
                        { value: 'indica', label: 'Indica' },
                        { value: 'hybrid', label: 'Hybrid' }
                      ].map(strain => (
                        <label key={strain.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={strain.value}
                            checked={filters.strainTypes?.includes(strain.value) || false}
                            onChange={(e) => handleArrayFilter('strainTypes', strain.value, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{strain.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dispensary Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Dispensary</label>
                    <input
                      type="text"
                      placeholder="Search dispensaries..."
                      value={dispensarySearch}
                      onChange={(e) => setDispensarySearch(e.target.value.toLowerCase())}
                      className="w-full p-2 mb-2 border rounded-lg text-sm"
                    />
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                      {dispensariesList
                        .filter(disp => disp.name.toLowerCase().includes(dispensarySearch))
                        .map(disp => (
                          <label key={disp.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={disp.id}
                              checked={filters.dispensaryIds?.includes(disp.id.toString()) || false}
                              onChange={(e) => handleArrayFilter('dispensaryIds', e.target.value, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{disp.name}</span>
                          </label>
                        ))}
                      {dispensariesList.filter(d => d.name.toLowerCase().includes(dispensarySearch)).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No dispensaries found</p>
                      )}
                    </div>
                  </div>

                  {/* Brand Filter */}
                  {brandsList.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Brand</label>
                      <input
                        type="text"
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value.toLowerCase())}
                        className="w-full p-2 mb-2 border rounded-lg text-sm"
                      />
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                        {brandsList
                          .filter(brand => brand.toLowerCase().includes(brandSearch))
                          .map(brand => (
                            <label key={brand} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={brand}
                                checked={filters.brands?.includes(brand) || false}
                                onChange={(e) => handleArrayFilter('brands', e.target.value, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm">{brand}</span>
                            </label>
                          ))}
                        {brandsList.filter(b => b.toLowerCase().includes(brandSearch)).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">No brands found</p>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Min THC */}
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

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                      className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
                    >
                      <option value="effective_price">Best Value (Price)</option>
                      <option value="thc">Highest THC</option>
                      {useLocation && userCoords && (
                        <option value="distance">Nearest First</option>
                      )}
                    </select>
                  </div>

                  {/* Active Filters Summary */}
                  {(filters.searchKeyword || filters.categories.length > 0 || filters.strainTypes.length > 0 || filters.dealTypes.length > 0 || filters.dispensaryIds.length > 0 || filters.brands.length > 0 || filters.city || filters.minPrice || filters.maxPrice || filters.minTHC) && (
                    <div className="text-xs text-gray-500 border-t pt-3">
                      <p className="font-medium mb-1">Active Filters:</p>
                      <div className="flex flex-wrap gap-1">
                        {filters.searchKeyword && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">Search: {filters.searchKeyword}</span>
                        )}
                        {filters.city && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">City: {filters.city}</span>
                        )}
                        {filters.dealTypes.map(d => (
                          <span key={d} className="bg-gray-100 px-2 py-0.5 rounded">{d}</span>
                        ))}
                        {filters.categories.map(c => (
                          <span key={c} className="bg-gray-100 px-2 py-0.5 rounded">{c.replace('_', ' ')}</span>
                        ))}
                        {filters.strainTypes.map(s => (
                          <span key={s} className="bg-gray-100 px-2 py-0.5 rounded">{s}</span>
                        ))}
                        {filters.dispensaryIds.length > 0 && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{filters.dispensaryIds.length} dispensaries</span>
                        )}
                        {filters.brands.length > 0 && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{filters.brands.length} brands</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setFilters({
                        categories: [],
                        strainTypes: [],
                        dealTypes: [],
                        dispensaryIds: [],
                        brands: [],
                        city: '',
                        minPrice: '',
                        maxPrice: '',
                        minTHC: '',
                        sortBy: 'effective_price',
                        searchKeyword: ''
                      })
                      setDispensarySearch('')
                      setBrandSearch('')
                      setSelectedCity('')
                      setUseLocation(true)
                      localStorage.setItem('hybridhunting-useLocation', 'true')
                      localStorage.removeItem('hybridhunting-city')
                    }}
                    className="w-full py-2.5 md:py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-3/4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8D8C0] mx-auto"></div>
                <p className="mt-2 text-lg">Loading deals...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-xl text-gray-500 mb-4">No products found</p>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {products.map(product => (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition">
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
                            <span className="font-medium capitalize">{product.category?.replace('_', ' ')}</span>
                          </div>
                          
                          {product.brand && (
                            <div className="flex justify-between text-sm md:text-base">
                              <span className="text-gray-600">Brand</span>
                              <span className="font-medium">{product.brand}</span>
                            </div>
                          )}
                          
                          {product.thc_percentage && (
                            <div className="flex justify-between text-sm md:text-base">
                              <span className="text-gray-600">THC</span>
                              <span className="font-medium">{product.thc_percentage}%</span>
                            </div>
                          )}
                          
                          {product.strain_type && (
                            <div className="flex justify-between text-sm md:text-base">
                              <span className="text-gray-600">Strain</span>
                              <span className="font-medium capitalize">{product.strain_type}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm md:text-base gap-1 sm:gap-2">
                            <span className="text-gray-600">Dispensary</span>
                            <span className="font-medium sm:text-right break-words">
                              {product.dispensaries?.name}
                            </span>
                          </div>
                          
                          {product.distance && useLocation && (
                            <div className="flex justify-between text-sm md:text-base">
                              <span className="text-gray-600">Distance</span>
                              <span className="font-medium">{product.distance} mi</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="text-xl md:text-2xl font-bold text-[#2A2A2A]">
                                ${product.effectivePrice ? product.effectivePrice.toFixed(2) : product.price?.toFixed(2) || '0.00'}
                              </div>
                              <div className="text-xs md:text-sm text-gray-500">
                                {product.deal_type === 'bundle' && product.deal_quantity > 1
                                  ? `${product.deal_quantity} for $${product.deal_total_price}`
                                  : product.deal_type === 'discount'
                                  ? `${product.deal_total_price} (${Math.round(((product.price - product.deal_total_price) / product.price) * 100)}% off)`
                                  : product.deal_type === 'bogo'
                                  ? 'BOGO Deal'
                                  : 'per unit'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                              <FavoriteButton productId={product.id} />
                              <Link href={`/product/${product.id}`}>
                                <button className="px-4 py-2 md:px-6 md:py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 text-sm md:text-base">
                                  View Deal
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    
                    {pageNumbers.map((page, idx) => (
                      page === '...' ? (
                        <span key={idx} className="px-3 py-2 text-gray-500">...</span>
                      ) : (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-[#C8D8C0] text-[#2A2A2A] font-bold'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          } border`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}