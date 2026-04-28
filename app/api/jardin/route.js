import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dispensariesToSync } from '@/lib/dispensaries'

async function fetchProductsFromLeaflyPage(dispensarySlug, pageNumber) {
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
    console.error(`Error parsing Leafly page for ${dispensarySlug}:`, error)
    return { menuItems: [], totalItems: 0 }
  }
}

async function fetchWeedmapsPage(dispensarySlug, pageNumber) {
  const url = `https://weedmaps.com/dispensaries/${dispensarySlug}?page=${pageNumber}`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
  })
  
  if (!response.ok) return { products: [], totalProducts: 0, hasMorePages: false }
  
  const html = await response.text()
  
  const productCountMatch = html.match(/data-testid="menu-item-count-header"[^>]*>(\d+)\s*Products?</i)
  const totalProducts = productCountMatch ? parseInt(productCountMatch[1]) : 0
  
  const hasMorePages = html.includes('data-testid="pagination-next-btn"') && 
                       !html.includes('PaginationButton-sc-101b7079-2 selected')
  
  const products = []
  const productBlockRegex = /<li[^>]*data-test-id="menu-item-list-item"[^>]*>([\s\S]*?)<\/li>/gi
  
  let blockMatch
  while ((blockMatch = productBlockRegex.exec(html)) !== null) {
    const block = blockMatch[1]
    
    let nameMatch = block.match(/data-testid="menu-item-title"[^>]*>([^<]+)</)
    let name = nameMatch ? nameMatch[1].trim() : null
    
    if (!name) {
      nameMatch = block.match(/<div[^>]*data-testid="menu-item-title"[^>]*>([^<]+)</)
      name = nameMatch ? nameMatch[1].trim() : null
    }
    
    if (!name) continue
    
    // Decode HTML entities for product name
    name = name
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&frac12;/g, '1/2')
      .replace(/&frac14;/g, '1/4')
      .replace(/&frac34;/g, '3/4')
    
    let rawCategory = 'other'
    let categoryMatch = block.match(/data-testid="menu-item-category"[^>]*>([^<]+)</)
    if (categoryMatch) {
      rawCategory = categoryMatch[1].trim().toLowerCase()
    }
    
    if (!categoryMatch || rawCategory === 'other') {
      categoryMatch = block.match(/<div[^>]*data-testid="menu-item-category"[^>]*>([^<]+)</)
      if (categoryMatch) {
        rawCategory = categoryMatch[1].trim().toLowerCase()
      }
    }
    
    let priceMatch = block.match(/data-testid="price"[^>]*>[$]?([0-9.]+)</)
    let price = priceMatch ? parseFloat(priceMatch[1]) : null
    
    let originalPriceMatch = block.match(/data-testid="original-price"[^>]*>[$]?([0-9.]+)</)
    let originalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[1]) : price
    
    if (!price && originalPrice) price = originalPrice
    
    let thcPercentage = null
    const thcMatch = block.match(/([0-9.]+)%\s*THC/i)
    if (thcMatch) {
      thcPercentage = parseFloat(thcMatch[1])
    }
    
    let brandMatch = block.match(/data-testid="menu-item-brand"[^>]*>([^<]+)</)
    let brand = brandMatch ? brandMatch[1].trim() : null
    if (brand) {
      // Decode HTML entities for brand name - FIX for &amp;SHINE
      brand = brand
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    }
    
    // ----- IMPROVED CATEGORY DETECTION WITH FALSE POSITIVE PREVENTION -----
    let mappedCategory = 'other'
    const nameLower = name.toLowerCase()
    
    // FIRST: Check if this is an ACCESSORY (non-cannabis product)
    const accessoryKeywords = [
      'battery', 'charger', 'grinder', 'pipe', 'bong', 'rig', 'bowl', 'taster', 'chillum',
      'paper', 'cone', 'wrap', 'tray', 'ashtray', 'lighter', 'cleaner', 'tool', 'dab tool',
      'shirt', 'hoodie', 'hat', 'lanyard', 'sticker', 'poster', 'bag', 'container', 'jar',
      'filter tip', 'tube', 'blunt tube', 'wood filter', 'packaging', 'case', 'hardcase',
      'keychain', 'pin', 'patch', 'sweatshirt', 'tee', 'tank top', 'beanie', 'snapback'
    ]
    
    let isAccessory = false
    for (const keyword of accessoryKeywords) {
      if (nameLower.includes(keyword)) {
        isAccessory = true
        break
      }
    }
    
    const accessoryRawCategories = ['batteries', 'push button', 'pipes', 'bowls', 'dab rigs', 
                                     'grinders', 'rolling papers', 'shirts', 'hoodies', 'hats', 
                                     'accessories', 'gear', 'dab tools', 'pods', 'cartridge']
    
    for (const cat of accessoryRawCategories) {
      if (rawCategory === cat) {
        isAccessory = true
        break
      }
    }
    
    if (isAccessory) {
      mappedCategory = 'accessories'
    }
    // THEN check for Pre-rolls (only if not already accessory)
    else if ((nameLower.includes('pre-roll') || nameLower.includes('preroll') || 
              nameLower.includes('dogwalker') || nameLower.includes('mini dog') ||
              nameLower.includes('blunt') || nameLower.includes('joint') ||
              rawCategory === 'pre-rolls' || rawCategory === 'joints' || rawCategory === 'blunts' ||
              rawCategory === 'infused blunts' || rawCategory === 'infused joints' || 
              rawCategory === 'infused minis' || rawCategory === 'infused pre-rolls') &&
              !nameLower.includes('filter') && !nameLower.includes('tube') && !nameLower.includes('wrap')) {
      mappedCategory = 'pre_rolls'
    }
    // Flower
    else if (nameLower.includes('flower') || nameLower.includes('buds') || 
             rawCategory === 'big buds' || rawCategory === 'smalls' || rawCategory === 'flower') {
      mappedCategory = 'flower'
    }
    // Disposable Vapes (all-in-one)
    else if (nameLower.includes('disposable') || nameLower.includes('all-in-one') || 
             nameLower.includes('aio') || rawCategory === 'all-in-one') {
      mappedCategory = 'vapes'
    }
    // Cartridges
    else if ((nameLower.includes('cartridge') || nameLower.includes('pod') || nameLower.includes('cart') ||
              rawCategory === 'cartridge' || rawCategory === 'pods') &&
              !nameLower.includes('battery')) {
      mappedCategory = 'carts'
    }
    // Edibles
    else if (nameLower.includes('gummy') || nameLower.includes('edible') || nameLower.includes('chocolate') || 
             nameLower.includes('brownie') || nameLower.includes('cookie') || nameLower.includes('mint') ||
             nameLower.includes('tablet') || nameLower.includes('capsule') || nameLower.includes('tincture') ||
             nameLower.includes('drop') || nameLower.includes('rso') ||
             rawCategory === 'edibles' || rawCategory === 'gummies' || rawCategory === 'chocolates' ||
             rawCategory === 'mints' || rawCategory === 'capsules' || rawCategory === 'tinctures' || 
             rawCategory === 'rso') {
      mappedCategory = 'edibles'
    }
    // Concentrates
    else if (nameLower.includes('wax') || nameLower.includes('shatter') || nameLower.includes('rosin') || 
             nameLower.includes('resin') || nameLower.includes('badder') || nameLower.includes('crumble') ||
             nameLower.includes('sugar') || nameLower.includes('diamond') || nameLower.includes('live') ||
             rawCategory === 'concentrates' || rawCategory === 'rosin' || rawCategory === 'solventless') {
      mappedCategory = 'concentrates'
    }
    // CBD
    else if (nameLower.includes('cbd') && !nameLower.includes('thc')) {
      mappedCategory = 'cbd'
    }
    // Topicals
    else if (nameLower.includes('topical') || nameLower.includes('cream') || nameLower.includes('lotion') ||
             nameLower.includes('balm') || rawCategory === 'topicals' || rawCategory === 'balms') {
      mappedCategory = 'topicals'
    }
    
    // Extract strain type (with false positive prevention)
    let strainType = null
    if (nameLower.includes('indica') && !nameLower.includes('hybrid') && !isAccessory) {
      strainType = 'indica'
    } else if (nameLower.includes('sativa') && !nameLower.includes('hybrid') && !isAccessory) {
      strainType = 'sativa'
    } else if (nameLower.includes('hybrid') && !isAccessory) {
      strainType = 'hybrid'
    }
    
    let dealType = 'single'
    let discountPercentage = null
    let dealTotalPrice = null
    
    if (originalPrice && price && originalPrice > price) {
      dealType = 'discount'
      discountPercentage = Math.round((1 - price / originalPrice) * 100)
      dealTotalPrice = price
    }
    
    products.push({
      name,
      price: price || 0,
      originalPrice: originalPrice || price || 0,
      thcPercentage,
      brand,
      category: mappedCategory,
      rawCategory: rawCategory,
      strainType,
      dealType,
      discountPercentage,
      dealTotalPrice
    })
  }
  
  if (products.length > 0 && pageNumber === 1) {
    console.log(`      Sample product mapping:`)
    products.slice(0, 5).forEach(p => {
      console.log(`        "${p.name}" -> category: "${p.category}" (raw: "${p.rawCategory}")`)
    })
  }
  
  return { products, totalProducts, hasMorePages }
}

async function fetchAllWeedmapsProducts(dispensarySlug) {
  let allProducts = []
  let currentPage = 1
  let hasMorePages = true
  let totalProducts = 0
  
  console.log(`      Fetching Weedmaps products for ${dispensarySlug}...`)
  
  while (hasMorePages && currentPage <= 50) {
    console.log(`        Page ${currentPage}...`)
    
    const result = await fetchWeedmapsPage(dispensarySlug, currentPage)
    
    if (currentPage === 1 && result.totalProducts > 0) {
      totalProducts = result.totalProducts
      console.log(`        Total products found: ${totalProducts}`)
    }
    
    allProducts = [...allProducts, ...result.products]
    hasMorePages = result.hasMorePages
    currentPage++
    
    if (hasMorePages) await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`        Fetched ${allProducts.length} products from Weedmaps`)
  return allProducts
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function mapLeaflyCategory(leaflyCategory, productName) {
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
  
  let mappedCategory = categoryMap[leaflyCategory?.toLowerCase()] || 'other'
  
  if (isDisposableVape(productName, leaflyCategory)) {
    mappedCategory = 'vapes'
  }
  
  return mappedCategory
}

async function syncDispensary(dispensaryConfig) {
  const { name, leaflySlug, city, state, address, lat, lng, website } = dispensaryConfig
  
  console.log(`\n📋 Syncing ${name}...`)
  console.log(`   Leafly Slug: ${leaflySlug}`)
  
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
  
  // ----- STEP 1: Try Leafly -----
  let allProducts = []
  let totalItems = 0
  let source = 'Leafly'
  
  let page1 = await fetchProductsFromLeaflyPage(leaflySlug, 1)
  allProducts = [...page1.menuItems]
  totalItems = page1.totalItems
  
  const productsPerPage = page1.menuItems.length
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / productsPerPage) : 0
  
  if (totalPages > 0) {
    console.log(`   Leafly: Products per page: ${productsPerPage}, Total pages: ${totalPages}`)
    
    for (let page = 2; page <= totalPages; page++) {
      const pageData = await fetchProductsFromLeaflyPage(leaflySlug, page)
      if (pageData.menuItems && pageData.menuItems.length > 0) {
        allProducts = [...allProducts, ...pageData.menuItems]
      }
      await sleep(2000)
    }
  }
  
  console.log(`   Leafly total products fetched: ${allProducts.length}`)
  
  // ----- STEP 2: If Leafly returned 0 products, try Weedmaps -----
  if (allProducts.length === 0) {
    console.log(`   ⚠️ No products found on Leafly, falling back to Weedmaps...`)
    
    const weedmapsSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    const weedmapsProducts = await fetchAllWeedmapsProducts(weedmapsSlug)
    
    if (weedmapsProducts.length > 0) {
      source = 'Weedmaps'
      console.log(`   ✅ Weedmaps total products fetched: ${weedmapsProducts.length}`)
      
      allProducts = weedmapsProducts.map(p => ({
        name: p.name,
        price: p.price,
        thcContent: p.thcPercentage,
        brandName: p.brand,
        productCategory: p.rawCategory,
        category: p.category,
        strain: p.strainType ? { category: p.strainType } : null,
        deal: p.dealType !== 'single' ? {
          kind: p.dealType === 'discount' ? 'sale' : p.dealType,
          discountType: p.dealType === 'discount' ? 'percent' : null,
          discountAmount: p.discountPercentage,
          buyQuantity: p.dealType === 'bundle' ? 2 : null
        } : null
      }))
    } else {
      console.log(`   ❌ No products found on Weedmaps either`)
    }
  }
  
  if (allProducts.length === 0) {
    console.log(`   No products found from any source`)
    return {
      name,
      productsFetched: 0,
      newProductsAdded: 0,
      totalProducts: 0,
      dispensaryId,
      source: 'None'
    }
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
    let category = item.category || 'other'
    
    if (source === 'Leafly') {
      category = mapLeaflyCategory(item.productCategory, item.name)
    }
    
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
      category: category,
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
    dispensaryId,
    source
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const specificSlug = searchParams.get('slug')
    
    let dispensariesToProcess = dispensariesToSync
    
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
        console.log(`✅ ${result.name} (${result.source}): +${result.newProductsAdded} new products (Total: ${result.totalProducts})`)
      } catch (error) {
        console.error(`❌ Failed to sync ${dispensary.name}:`, error)
        results.push({
          name: dispensary.name,
          error: error.message
        })
      }
      
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