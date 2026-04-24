'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Formatting helper functions
const formatCategory = (cat) => {
  const words = cat.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  )
  return words.join(' ')
}

const formatDealType = (deal) => {
  if (deal === 'bogo') return 'BOGO'
  if (deal === 'bundle') return 'Bundle'
  return deal.charAt(0).toUpperCase() + deal.slice(1)
}

export default function AdminPage() {
  const [dispensaries, setDispensaries] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState('')
  const [configDispensaries, setConfigDispensaries] = useState([])
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'flower',
    strain_type: 'hybrid',
    thc_percentage: '',
    price: '',
    deal_type: 'single',
    deal_quantity: 1,
    deal_total_price: '',
    dispensary_id: ''
  })

  // Load all data
  useEffect(() => {
    loadDispensaries()
    loadProducts()
    loadConfigDispensaries()
  }, [])

  async function loadDispensaries() {
    const { data } = await supabase.from('dispensaries').select('*')
    setDispensaries(data || [])
  }

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*, dispensaries(name)')
    setProducts(data || [])
  }

  async function loadConfigDispensaries() {
    try {
      const res = await fetch('/api/dispensaries-config')
      const data = await res.json()
      setConfigDispensaries(data.dispensaries || [])
    } catch (error) {
      console.error('Failed to load config dispensaries:', error)
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault()
    
    const productData = {
      ...newProduct,
      thc_percentage: newProduct.thc_percentage === '' ? null : parseFloat(newProduct.thc_percentage),
      price: newProduct.price === '' ? null : parseFloat(newProduct.price),
      deal_quantity: newProduct.deal_quantity === '' ? 1 : parseInt(newProduct.deal_quantity),
      deal_total_price: newProduct.deal_total_price === '' ? null : parseFloat(newProduct.deal_total_price),
      dispensary_id: parseInt(newProduct.dispensary_id)
    }
    
    const { error } = await supabase
      .from('products')
      .insert([productData])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Product added successfully!')
      setNewProduct({
        name: '',
        category: 'flower',
        strain_type: 'hybrid',
        thc_percentage: '',
        price: '',
        deal_type: 'single',
        deal_quantity: 1,
        deal_total_price: '',
        dispensary_id: ''
      })
      loadProducts()
    }
  }

  async function syncAllDispensaries() {
    setLoading(true)
    try {
      const res = await fetch('/api/jardin')
      const data = await res.json()
      if (data.success) {
        let message = `Synced ${data.results.length} dispensaries:\n`
        data.results.forEach(r => {
          if (r.error) {
            message += `❌ ${r.name}: ${r.error}\n`
          } else {
            message += `✅ ${r.name}: +${r.newProductsAdded} new products (Total: ${r.totalProducts})\n`
          }
        })
        alert(message)
        loadProducts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function syncSingleDispensary() {
    if (!selectedSlug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jardin?slug=${selectedSlug}`)
      const data = await res.json()
      if (data.success && data.results[0]) {
        const r = data.results[0]
        if (r.error) {
          alert(`❌ ${r.name}: ${r.error}`)
        } else {
          alert(`✅ ${r.name}: +${r.newProductsAdded} new products (Total: ${r.totalProducts})`)
        }
        loadProducts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">HybridHunting Admin</h1>
      
      {/* Sync Buttons */}
      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <button
          onClick={syncAllDispensaries}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync ALL Dispensaries'}
        </button>
        
        <div className="flex gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="">Sync specific dispensary...</option>
            {configDispensaries.map(disp => (
              <option key={disp.leaflySlug} value={disp.leaflySlug}>
                {disp.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={syncSingleDispensary}
            disabled={loading || !selectedSlug}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Sync Selected
          </button>
        </div>
      </div>
      
      {/* Add Product Form */}
      <div className="mb-12 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold mb-4">Add New Product/Deal</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            className="p-3 border rounded"
            required
          />
          
          <select
            value={newProduct.category}
            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            className="p-3 border rounded"
          >
            <option value="flower">Flower</option>
            <option value="edibles">Edibles</option>
            <option value="vapes">Vapes</option>
            <option value="carts">Carts</option>
            <option value="concentrates">Concentrates</option>
            <option value="pre_rolls">Pre-Rolls</option>
            <option value="cbd">CBD</option>
            <option value="accessories">Accessories</option>
            <option value="topicals">Topicals</option>
            <option value="other">Other</option>
          </select>
          
          <input
            type="number"
            placeholder="THC %"
            value={newProduct.thc_percentage}
            onChange={(e) => setNewProduct({...newProduct, thc_percentage: e.target.value})}
            className="p-3 border rounded"
            step="0.1"
          />
          
          <input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            className="p-3 border rounded"
            step="0.01"
          />
          
          <select
            value={newProduct.deal_type}
            onChange={(e) => setNewProduct({...newProduct, deal_type: e.target.value})}
            className="p-3 border rounded"
          >                   
            <option value="single">Single Item</option>
            <option value="bundle">Bundle Deal</option>
            <option value="bogo">Buy One Get One (BOGO)</option>
            <option value="discount">Percentage Discount</option>
          </select>
          
          {newProduct.deal_type === 'bundle' && (
            <>
              <input
                type="number"
                placeholder="Quantity (e.g., 3)"
                value={newProduct.deal_quantity}
                onChange={(e) => setNewProduct({...newProduct, deal_quantity: e.target.value})}
                className="p-3 border rounded"
              />
              <input
                type="number"
                placeholder="Total Bundle Price"
                value={newProduct.deal_total_price}
                onChange={(e) => setNewProduct({...newProduct, deal_total_price: e.target.value})}
                className="p-3 border rounded"
                step="0.01"
              />
            </>
          )}
          
          <select
            value={newProduct.dispensary_id}
            onChange={(e) => setNewProduct({...newProduct, dispensary_id: e.target.value})}
            className="p-3 border rounded"
            required
          >
            <option value="">Select Dispensary</option>
            {dispensaries.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          <button
            type="submit"
            className="col-span-1 md:col-span-2 p-3 bg-green-500 text-white font-bold rounded hover:bg-green-600"
          >
            Add Product
          </button>
        </form>
      </div>
      
      {/* Existing Products Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Existing Products ({products.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Category</th>
                <th className="p-3 border">THC%</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Deal</th>
                <th className="p-3 border">Dispensary</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td className="p-3 border">{product.name}</td>
                  <td className="p-3 border capitalize">{product.category}</td>
                  <td className="p-3 border">{product.thc_percentage}%</td>
                  <td className="p-3 border">${product.price}</td>
                  <td className="p-3 border">
                    {product.deal_type === 'bundle' 
                      ? `${product.deal_quantity} for $${product.deal_total_price}`
                      : product.deal_type?.charAt(0).toUpperCase() + product.deal_type?.slice(1)}
                  </td>
                  <td className="p-3 border">{product.dispensaries?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}