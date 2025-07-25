import { NextRequest, NextResponse } from 'next/server'
import { supabase, isDemoMode } from '@/lib/supabase'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

function checkRateLimit(key: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request)
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Enhanced CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://littleforest.onrender.com' 
      : '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }

  try {
    // In demo mode, return sample data
    if (isDemoMode) {
      const demoProducts = [
        {
          id: "1",
          plant_name: "African Olive",
          scientific_name: "Olea europaea subsp. cuspidata",
          category: "Indigenous Trees",
          quantity: 45,
          price: 1200,
          description: "Beautiful indigenous tree perfect for landscaping",
          image_url: "https://example.com/african-olive.jpg",
          availability_status: "Limited",
          ready_for_sale: true
        }
      ]
      
      return NextResponse.json({
        success: true,
        products: demoProducts,
        total_count: demoProducts.length
      })
    }

    // Fetch products that are ready for sale (plants and honey)
    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('ready_for_sale', true)
      .or('item_type.eq.Honey,category.eq.Organic Honey,item_type.is.null')
      .order('plant_name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Sanitize and validate data
    function sanitizeString(str: string): string {
      if (!str) return ''
      return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim()
    }

    function validateProduct(product: any): boolean {
      return product.id && 
             product.plant_name && 
             typeof product.quantity === 'number' && 
             typeof product.price === 'number' &&
             product.price >= 0 &&
             product.quantity >= 0
    }

    // Transform and sanitize the data
    const transformedProducts = products?.filter(validateProduct).map(product => {
      const isHoney = product.item_type === "Honey" || product.category === "Organic Honey"
      
      let availability_status = "Not Available"
      if (isHoney) {
        // For honey products, different availability thresholds
        if (product.quantity >= 10) {
          availability_status = "Available"
        } else if (product.quantity >= 1) {
          availability_status = "Limited"
        }
      } else {
        // For plants
        if (product.quantity >= 100) {
          availability_status = "Available"
        } else if (product.quantity >= 10) {
          availability_status = "Limited"
        }
      }

      return {
        id: sanitizeString(product.id),
        plant_name: sanitizeString(product.plant_name),
        scientific_name: sanitizeString(product.scientific_name || ''),
        category: sanitizeString(product.category || ''),
        quantity: Math.max(0, parseInt(product.quantity) || 0),
        unit: sanitizeString(product.unit || (isHoney ? 'kg' : 'seedlings')),
        price: Math.max(0, parseFloat(product.price) || 0),
        description: sanitizeString(product.description || (isHoney ? `Premium ${product.plant_name} - ${product.age || 'Natural honey'}` : `High quality ${product.plant_name} seedlings`)),
        image_url: sanitizeString(product.image_url || '/placeholder.svg'),
        availability_status,
        ready_for_sale: Boolean(product.ready_for_sale),
        sku: sanitizeString(product.sku || ''),
        item_type: sanitizeString(product.item_type || '')
      }
    }) || []

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total_count: transformedProducts.length
    }, { headers })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
