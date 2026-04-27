'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dispensary, setDispensary] = useState(null)

  useEffect(() => {
    async function loadProduct() {
      if (!id) return
      
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error loading product:', error)
        setLoading(false)
        return
      }
      
      setProduct(productData)
      
      if (productData.dispensary_id) {
        const { data: dispensaryData } = await supabase
          .from('dispensaries')
          .select('*')
          .eq('id', productData.dispensary_id)
          .single()
        setDispensary(dispensaryData)
      }
      
      setLoading(false)
    }
    
    loadProduct()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8D8C0]"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-xl text-gray-500">Product not found</p>
        <Link href="/search-wrapper" className="text-[#C8D8C0] hover:underline mt-4 inline-block">
          ← Back to search
        </Link>
      </div>
    )
  }

  let effectivePrice = product.price || 0
  let savings = 0
  
  if (product.deal_type === 'bundle' && product.deal_quantity > 1) {
    effectivePrice = product.deal_total_price / product.deal_quantity
    savings = ((product.price - effectivePrice) / product.price) * 100
  } else if (product.deal_type === 'discount' && product.deal_total_price) {
    effectivePrice = product.deal_total_price
    savings = ((product.price - effectivePrice) / product.price) * 100
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/search-wrapper" className="text-[#C8D8C0] hover:underline text-sm md:text-base inline-block mb-6">
          ← Back to search
        </Link>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {savings > 0 && (
            <div className="bg-[#EDBD8F] px-4 py-3 text-center">
              <span className="font-bold text-lg">Save {Math.round(savings)}%</span>
            </div>
          )}
          
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2A2A2A] mb-4">{product.name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium capitalize">{product.category?.replace('_', ' ')}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Brand</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.thc_percentage && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">THC Content</span>
                    <span className="font-medium">{product.thc_percentage}%</span>
                  </div>
                )}
                {product.strain_type && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Strain Type</span>
                    <span className="font-medium capitalize">{product.strain_type}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Deal Type</span>
                  <span className="font-medium capitalize">
                    {product.deal_type === 'single' && 'Single Item'}
                    {product.deal_type === 'bundle' && `Bundle (${product.deal_quantity} items)`}
                    {product.deal_type === 'bogo' && 'Buy One Get One'}
                    {product.deal_type === 'discount' && 'Percentage Discount'}
                  </span>
                </div>
              </div>
              
              {dispensary && (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Dispensary</span>
                    <span className="font-medium text-right">{dispensary.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium text-right">{dispensary.city}, {dispensary.state}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Address</span>
                    <span className="font-medium text-right">{dispensary.address}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {savings > 0 ? (
                    <>
                      <div className="text-3xl md:text-4xl font-bold text-[#2A2A2A]">
                        ${effectivePrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        Regular: ${product.price?.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        You save ${(product.price - effectivePrice).toFixed(2)} ({Math.round(savings)}% off)
                      </div>
                    </>
                  ) : (
                    <div className="text-3xl md:text-4xl font-bold text-[#2A2A2A]">
                      ${product.price?.toFixed(2)}
                    </div>
                  )}
                  
                  {product.deal_type === 'bundle' && product.deal_quantity > 1 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {product.deal_quantity} items for ${product.deal_total_price}
                    </div>
                  )}
                  {product.deal_type === 'bogo' && (
                    <div className="text-sm text-gray-500 mt-1">
                      Buy one, get one free (or discounted)
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <FavoriteButton productId={product.id} />
                  {dispensary?.website ? (
                    <a 
                      href={dispensary.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 inline-block text-center"
                    >
                      Visit Dispensary Website →
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="px-6 py-3 bg-gray-300 text-gray-500 font-bold rounded-lg cursor-not-allowed"
                    >
                      Website Unavailable
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Buy Me a Coffee Button - Product Page */}
            <div className="mt-8 text-center">
              <a
                href="https://www.buymeacoffee.com/hybridhunting"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDD00] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 transition text-sm md:text-base"
              >
                <span>☕</span>
                Buy Me a Coffee
              </a>
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 leading-relaxed">
                Prices and availability are provided by third-party dispensaries and may change without notice.
                HybridHunting does not guarantee the accuracy of any pricing or product information shown.
                Please verify all details directly with the dispensary before making a purchase.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">
                Nothing on this website is intended to be medical advice. Always consult a physician before using cannabis products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}