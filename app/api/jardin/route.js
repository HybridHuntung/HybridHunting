import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dispensariesToSync } from '@/lib/dispensaries'

async function fetchProductsFromPage(dispensarySlug, pageNumber) {
  const url = `https://www.leafly.com/dispensary-info/${dispensarySlug}/menu?page=${pageNumber}`
  const response = await fetch(url)
  const html = await response.text()
  
  const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)
  if (!jsonMatch) return { menuItems: [], totalItems: 0 }
  
  try {
    const pageData = JSON.parse(jsonMatch[1])
    const menuItems = pageData?.props?.pageProps?.menuData?.menuItems || []
    const totalItems = pageData?.props?.pageProps?.menuData?.totalItems || 0
    return { menuItems, totalItems }
  } catch (error) {
    console.error(`Error parsing page for ${dispensarySlug}:`, error)
    return { menuItems: [], totalItems: 0 }
  }
}

async function syncDispensary(dispensaryConfig) {
  const { name, leaflySlug, city, state, address, lat, lng, website } = dispensaryConfig
  
  console.log(`Syncing ${name}...`)
  
  // Find or create dispensary in database
  let { data: dispensaryData, error: dispensaryError } = await supabase
    .from('dispensaries')
    .select('id')
    .eq('name', name)
    .single()
  
  if (dispensaryError || !dispensaryData) {
    const { data: newDispensary, error: insertError } = await supabase
      .from('dispensaries')
      .insert({
        name: name,
        city: city,
        state: state,
        address: address,
        lat: lat,
        lng: lng,
        website: website, 
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) throw new Error(`Failed to add dispensary ${name}: ${insertError.message}`)
    dispensaryData = newDispensary
  }
  
  const dispensaryId = dispensaryData.id
  
  // Fetch products
  let page1 = await fetchProductsFromPage(leaflySlug, 1)
  console.log(`Page 1 menu items count for ${name}: ${page1.menuItems.length}`)
  console.log(`Total items reported: ${page1.totalItems}`)
  let allProducts = [...page1.menuItems]
  console.log(`Total products collected after pagination: ${allProducts.length}`)
  let totalItems = page1.totalItems
  
  const productsPerPage = page1.menuItems.length
  const totalPages = Math.ceil(totalItems / productsPerPage)
  
  for (let page = 2; page <= totalPages; page++) {
    const pageData = await fetchProductsFromPage(leaflySlug, page)
    if (pageData.menuItems && pageData.menuItems.length > 0) {
      allProducts = [...allProducts, ...pageData.menuItems]
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Map categories
  const categoryMap = {
    'flower': 'flower',
    'preroll': 'pre_rolls',
    'cartridge': 'carts',
    'concentrate': 'concentrates',
    'edible': 'edibles',
    'accessory': 'accessories',
    'topical': 'topicals',
    'other': 'other'
  }
  
  const isDisposableVape = (name, category) => {
    if (category !== 'cartridge') return false
    const nameLower = name.toLowerCase()
    return nameLower.includes('all-in-one') || nameLower.includes('disposable') || nameLower.includes('aio')
  }
  
  // Get existing products
  const { data: existingProducts } = await supabase
    .from('products')
    .select('name')
    .eq('dispensary_id', dispensaryId)
  
  const existingNames = new Set(existingProducts?.map(p => p.name) || [])
  
  const newProducts = allProducts.filter(item => !existingNames.has(item.name))
  
  const productsToInsert = newProducts.map(item => {
    const leaflyCategory = item.productCategory?.toLowerCase() || 'other'
    let mappedCategory = categoryMap[leaflyCategory] || 'other'
    
    if (isDisposableVape(item.name, leaflyCategory)) {
      mappedCategory = 'vapes'
    }
    
    return {
      dispensary_id: dispensaryId,
      name: item.name,
      category: mappedCategory,
      price: item.price,
      thc_percentage: item.thcContent || null,
      strain_type: item.strain?.category?.toLowerCase() || null,
      brand: item.brandName || null,
    }
  })
  
  if (productsToInsert.length > 0) {
    const { error } = await supabase.from('products').insert(productsToInsert)
    if (error) throw error
  }
  
  return {
    name,
    productsFetched: allProducts.length,
    newProductsAdded: productsToInsert.length,
    totalProducts: existingNames.size + productsToInsert.length,
    dispensaryId
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificSlug = searchParams.get('slug')
    
    let dispensariesToProcess = dispensariesToSync
    
    // If a specific slug is provided, only sync that one
    if (specificSlug) {
      const specificDispensary = dispensariesToSync.find(d => d.leaflySlug === specificSlug)
      if (specificDispensary) {
        dispensariesToProcess = [specificDispensary]
      } else {
        return NextResponse.json({ 
          success: false, 
          error: `Dispensary with slug "${specificSlug}" not found in config`
        }, { status: 404 })
      }
    }
    
    const results = []
    
    for (const dispensary of dispensariesToProcess) {
      try {
        const result = await syncDispensary(dispensary)
        results.push(result)
        console.log(`✅ ${result.name}: +${result.newProductsAdded} new products`)
      } catch (error) {
        console.error(`❌ Failed to sync ${dispensary.name}:`, error)
        results.push({
          name: dispensary.name,
          error: error.message
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${results.length} dispensaries`,
      results
    })
    
  } catch (error) {
    console.error('Scraper error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}