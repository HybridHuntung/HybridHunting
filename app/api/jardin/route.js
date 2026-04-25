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

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function syncDispensary(dispensaryConfig) {
  const { name, leaflySlug, city, state, address, lat, lng, website } = dispensaryConfig
  
  console.log(`\n📋 Syncing ${name}...`)
  console.log(`   Slug: ${leaflySlug}`)
  
  // Find or create dispensary in database
  let { data: dispensaryData, error: dispensaryError } = await supabase
    .from('dispensaries')
    .select('id')
    .eq('name', name)
    .single()
  
  if (dispensaryError || !dispensaryData) {
    console.log(`   Dispensary not found, creating...`)
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
    console.log(`   Created with ID: ${dispensaryData.id}`)
  }
  
  const dispensaryId = dispensaryData.id
  
  // Fetch products
  let page1 = await fetchProductsFromPage(leaflySlug, 1)
  let allProducts = [...page1.menuItems]
  let totalItems = page1.totalItems
  
  const productsPerPage = page1.menuItems.length
  const totalPages = Math.ceil(totalItems / productsPerPage)
  
  console.log(`   Products per page: ${productsPerPage}, Total pages: ${totalPages}`)
  
  for (let page = 2; page <= totalPages; page++) {
    const pageData = await fetchProductsFromPage(leaflySlug, page)
    if (pageData.menuItems && pageData.menuItems.length > 0) {
      allProducts = [...allProducts, ...pageData.menuItems]
    }
    await sleep(2000)
  }
  
  console.log(`   Total products fetched: ${allProducts.length}`)
  
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
  console.log(`   Existing products: ${existingNames.size}`)
  
  const newProducts = allProducts.filter(item => !existingNames.has(item.name))
  console.log(`   New products to add: ${newProducts.length}`)
  
  const productsToInsert = newProducts.map(item => {
    const leaflyCategory = item.productCategory?.toLowerCase() || 'other'
    let mappedCategory = categoryMap[leaflyCategory] || 'other'
    
    if (isDisposableVape(item.name, leaflyCategory)) {
      mappedCategory = 'vapes'
    }
    
    // Extract deal information
    let dealType = 'single'
    let dealQuantity = null
    let dealTotalPrice = null
    let discountPercentage = null
    
    if (item.deal) {
      if (item.deal.kind === 'bundle') {
        dealType = 'bundle'
        dealQuantity = item.deal.buyQuantity || 0
        dealTotalPrice = item.deal.discountAmount ? item.deal.discountAmount / 100 : null
      } else if (item.deal.kind === 'sale' && item.deal.discountType === 'percent') {
        dealType = 'discount'
        discountPercentage = item.deal.discountAmount
        if (item.price && discountPercentage) {
          dealTotalPrice = item.price * (1 - discountPercentage / 100)
        }
      } else if (item.deal.kind === 'bogo') {
        dealType = 'bogo'
        dealQuantity = item.deal.buyQuantity || 1
        dealTotalPrice = item.deal.discountAmount ? item.deal.discountAmount / 100 : null
      }
    }
    
    return {
      dispensary_id: dispensaryId,
      name: item.name,
      category: mappedCategory,
      price: item.price,
      thc_percentage: item.thcContent || null,
      strain_type: item.strain?.category?.toLowerCase() || null,
      brand: item.brandName || null,
      deal_type: dealType,
      deal_quantity: dealQuantity,
      deal_total_price: dealTotalPrice,
      discount_percentage: discountPercentage,
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
        console.log(`\n🎯 Syncing specific dispensary: ${specificDispensary.name}`)
      } else {
        return NextResponse.json({ 
          success: false, 
          error: `Dispensary with slug "${specificSlug}" not found in config`
        }, { status: 404 })
      }
    } else {
      console.log(`\n🎯 Syncing ALL ${dispensariesToProcess.length} dispensaries`)
    }
    
    const results = []
    
    for (let i = 0; i < dispensariesToProcess.length; i++) {
      const dispensary = dispensariesToProcess[i]
      console.log(`\n📌 [${i + 1}/${dispensariesToProcess.length}] Processing...`)
      
      try {
        const result = await syncDispensary(dispensary)
        results.push(result)
        console.log(`✅ ${result.name}: +${result.newProductsAdded} new products (Total: ${result.totalProducts})`)
      } catch (error) {
        console.error(`❌ Failed to sync ${dispensary.name}:`, error)
        results.push({
          name: dispensary.name,
          error: error.message
        })
      }
      
      // 15 second delay between dispensaries (reduced from 30)
      if (i < dispensariesToProcess.length - 1) {
        console.log(`   Waiting 15 seconds before next dispensary...`)
        await sleep(15000)
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