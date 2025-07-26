import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache for products data
let cachedProducts: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check cache first
    const now = Date.now()
    if (cachedProducts && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        products: cachedProducts,
        total: cachedProducts.length,
        cached: true,
        responseTime: Date.now() - startTime
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=120',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://littleforest.onrender.com' 
            : '*',
        }
      })
    }

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database configuration missing',
          code: 'CONFIG_ERROR'
        }, 
        { status: 503 }
      )
    }

    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('ready_for_sale', true)
      .gt('quantity', 0)
      .order('plant_name')

    if (error) {
      console.error('Supabase error:', error)

      // Handle specific error types
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Inventory table not found',
            code: 'TABLE_NOT_FOUND'
          }, 
          { status: 404 }
        )
      }

      if (error.message?.includes('permission denied')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Database access denied',
            code: 'PERMISSION_DENIED'
          }, 
          { status: 403 }
        )
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch products from database',
          code: 'DATABASE_ERROR'
        }, 
        { status: 500 }
      )
    }

    if (!products) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No data returned from database',
          code: 'NO_DATA'
        }, 
        { status: 404 }
      )
    }

    const formattedProducts = products.map(product => {
      const quantity = Number(product.quantity) || 0
      let availability_status = 'Available'
      
      if (quantity >= 100) {
        availability_status = 'Available'
      } else if (quantity >= 10) {
        availability_status = 'Limited'
      } else {
        availability_status = 'Not Available'
      }

      return {
        id: product.id,
        plant_name: product.plant_name,
        scientific_name: product.scientific_name || '',
        category: product.category || 'Uncategorized',
        price: Number(product.price) || 0,
        quantity: quantity,
        description: product.description || '',
        image_url: product.image_url || '',
        availability_status: availability_status,
        ready_for_sale: product.ready_for_sale,
        sku: product.sku || '',
        // Legacy format for backward compatibility
        name: product.plant_name,
        scientificName: product.scientific_name || '',
        status: product.status || 'Available',
        age: product.age || '',
        inStock: quantity > 0,
        lastUpdated: product.updated_at || product.created_at
      }
    })

    // Update cache
    cachedProducts = formattedProducts
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
      cached: false,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=120',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
          ? 'https://littleforest.onrender.com' 
          : '*',
      }
    })

  } catch (error: any) {
    console.error('API error:', error)

    // Handle network errors
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Network connection failed',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      )
    }

    // Handle timeout errors
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Request timeout',
          code: 'TIMEOUT_ERROR'
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}