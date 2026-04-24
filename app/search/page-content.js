'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function SearchContent() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [urlProcessed, setUrlProcessed] = useState(false)
  const [dispensariesList, setDispensariesList] = useState([])
  const [brandsList, setBrandsList] = useState([])
  const [filters, setFilters] = useState({
    categories: [],
    strainTypes: [],
    dealTypes: [],
    dispensaryId: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minTHC: '',
    sortBy: 'effective_price',
    area: ''
  })

  const searchParams = useSearchParams()
  const [userLocation, setUserLocation] = useState(null)

  // Load dispensaries and brands for filters
  useEffect(() => {
    async function loadFilterOptions() {
      // Load dispensaries
      const { data: dispensaries } = await supabase
        .from('dispensaries')
        .select('id, name, area')
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

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl && !urlProcessed) {
      setFilters(prev => ({ ...prev, categories: [categoryFromUrl] }))
      setUrlProcessed(true)
    }
  }, [searchParams, urlProcessed])

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

  async function fetchProducts() {
    setLoading(true)
    
    try {
      let productQuery = supabase.from('products').select('*')
      
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
      if (filters.brand) productQuery = productQuery.eq('brand', filters.brand)
      if (filters.minPrice) productQuery = productQuery.gte('price', parseFloat(filters.minPrice))
      if (filters.maxPrice) productQuery = productQuery.lte('price', parseFloat(filters.maxPrice))
      if (filters.minTHC) productQuery = productQuery.gte('thc_percentage', parseFloat(filters.minTHC))
      if (filters.dispensaryId) productQuery = productQuery.eq('dispensary_id', parseInt(filters.dispensaryId))
      
      const { data: products, error } = await productQuery
      
      if (error) throw error
      
      if (products && products.length > 0) {
        const dispensaryIds = products.map(p => p.dispensary_id).filter(id => id != null)
        
        let dispensaryQuery = supabase.from('dispensaries').select('*')
        if (dispensaryIds.length > 0) dispensaryQuery = dispensaryQuery.in('id', dispensaryIds)
        if (filters.area && filters.area !== 'All Areas') dispensaryQuery = dispensaryQuery.eq('area', filters.area)
        dispensaryQuery = dispensaryQuery.eq('state', 'NV')
        
        const { data: dispensaries } = await dispensaryQuery
        
        const dispensaryMap = {}
        dispensaries?.forEach(d => { dispensaryMap[d.id] = d })
        
        let filteredProducts = products
        if (filters.area && filters.area !== 'All Areas') {
          filteredProducts = products.filter(p => {
            const dispensary = dispensaryMap[p.dispensary_id]
            return dispensary?.area === filters.area
          })
        }
        
        const transformedProducts = filteredProducts.map(product => {
          const dispensary = dispensaryMap[product.dispensary_id] || {}
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
        
        const sortedProducts = transformedProducts.sort((a, b) => {
          if (filters.sortBy === 'effective_price') return a.effectivePrice - b.effectivePrice
          if (filters.sortBy === 'thc') return b.thc_percentage - a.thc_percentage
          if (filters.sortBy === 'distance') return (a.distance || 999) - (b.distance || 999)
          return 0
        })
        
        setProducts(sortedProducts)
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
    if (urlProcessed || !searchParams.get('category')) {
      fetchProducts()
    }
  }, [filters, urlProcessed])

  // Helper function to handle checkbox changes for arrays
  const handleArrayFilter = (arrayName, value, checked) => {
    const currentArray = filters[arrayName] || []
    if (checked) {
      setFilters({...filters, [arrayName]: [...currentArray, value]})
    } else {
      setFilters({...filters, [arrayName]: currentArray.filter(item => item !== value)})
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
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
              </p>
            </div>
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
                  {/* Category Filter - Multi-select */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
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

                  {/* Strain Type Filter - Multi-select */}
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

                  {/* Deal Type Filter - Multi-select */}
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

                  {/* Dispensary Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Dispensary</label>
                    <select
                      value={filters.dispensaryId}
                      onChange={(e) => setFilters({...filters, dispensaryId: e.target.value})}
                      className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
                    >
                      <option value="">All Dispensaries</option>
                      {dispensariesList.map(disp => (
                        <option key={disp.id} value={disp.id}>{disp.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  {brandsList.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Brand</label>
                      <select
                        value={filters.brand}
                        onChange={(e) => setFilters({...filters, brand: e.target.value})}
                        className="w-full p-2.5 md:p-3 border rounded-lg text-sm md:text-base"
                      >
                        <option value="">All Brands</option>
                        {brandsList.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
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
                  
                  {/* Vegas Area */}
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
                    </div>
                  )}

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
                      <option value="distance">Nearest First</option>
                    </select>
                  </div>

                  {/* Selected Filters Summary */}
                  {(filters.categories.length > 0 || filters.strainTypes.length > 0 || filters.dealTypes.length > 0 || filters.dispensaryId || filters.brand || filters.minPrice || filters.maxPrice || filters.minTHC) && (
                    <div className="text-xs text-gray-500 border-t pt-3">
                      <p className="font-medium mb-1">Active Filters:</p>
                      <div className="flex flex-wrap gap-1">
                        {filters.categories.map(c => (
                          <span key={c} className="bg-gray-100 px-2 py-0.5 rounded">{c.replace('_', ' ')}</span>
                        ))}
                        {filters.strainTypes.map(s => (
                          <span key={s} className="bg-gray-100 px-2 py-0.5 rounded">{s}</span>
                        ))}
                        {filters.dealTypes.map(d => (
                          <span key={d} className="bg-gray-100 px-2 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset Button */}
                  <button
                    onClick={() => setFilters({
                      categories: [],
                      strainTypes: [],
                      dealTypes: [],
                      dispensaryId: '',
                      brand: '',
                      minPrice: '',
                      maxPrice: '',
                      minTHC: '',
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
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">THC</span>
                          <span className="font-medium">{product.thc_percentage}%</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Strain</span>
                          <span className="font-medium capitalize">{product.strain_type || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm md:text-base gap-1 sm:gap-2">
                          <span className="text-gray-600">Dispensary</span>
                          <span className="font-medium sm:text-right break-words">
                            {product.dispensaries?.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Distance</span>
                          <span className="font-medium">
                            {product.distance ? `${product.distance} mi` : 
                            product.dispensaries?.distance_miles ? `${product.dispensaries.distance_miles} mi` : 'N/A'}
                          </span>
                        </div>
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