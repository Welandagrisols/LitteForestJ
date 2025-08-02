import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache for products data
let cachedProducts: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      .not('created_at', 'is', null) // Ensure it was properly created through the system
      .not('updated_at', 'is', null) // Ensure it has update tracking
      .not('item_type', 'is', null) // Ensure it has proper item_type field
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

    // Filter out any products that weren't created through the dashboard
    const dashboardProducts = products.filter(product => {
      // Must have been created through the proper form (has all required fields)
      const hasRequiredFields = product.plant_name && 
                               product.category && 
                               product.price !== null && 
                               product.quantity !== null
      
      // Must have proper timestamps indicating it was created through the system
      const hasProperTimestamps = product.created_at && product.updated_at
      
      // Must have item_type field (dashboard-created items have this)
      const hasItemType = product.item_type === 'Plant' || product.item_type === 'Honey' || product.item_type === 'Consumable'
      
      return hasRequiredFields && hasProperTimestamps && hasItemType
    })

    const formattedProducts = dashboardProducts.map(product => {
      const quantity = Number(product.quantity) || 0
      let availability_status = 'Available'
      
      if (quantity >= 100) {
        availability_status = 'Available'
      } else if (quantity >= 10) {
        availability_status = 'Limited'
      } else {
        availability_status = 'Not Available'
      }

      // Handle image URL - check if field exists and has value
      let processedImageUrl = null;
      let hasValidImage = false;
      
      if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() !== '') {
        const imageUrl = product.image_url.trim();
        
        // If it's already a full URL, use it as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          processedImageUrl = imageUrl;
          hasValidImage = true;
        } else if (imageUrl.startsWith('/storage/v1/object/public/')) {
          // If it's a Supabase storage path, make it absolute
          processedImageUrl = `${supabaseUrl}${imageUrl}`;
          hasValidImage = true;
        } else if (imageUrl.startsWith('/')) {
          // If it's a relative path, make it absolute
          processedImageUrl = `${supabaseUrl}/storage/v1/object/public/plant-images${imageUrl}`;
          hasValidImage = true;
        } else {
          // If it's just a filename, construct the full Supabase storage URL
          processedImageUrl = `${supabaseUrl}/storage/v1/object/public/plant-images/plants/${imageUrl}`;
          hasValidImage = true;
        }
      }
      
      // Fallback high-quality placeholder for plants without images
      if (!hasValidImage) {
        processedImageUrl = `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
      }

      return {
        id: product.id,
        name: product.plant_name,
        plant_name: product.plant_name,
        scientificName: product.scientific_name || '',
        scientific_name: product.scientific_name || '',
        category: product.category || 'Uncategorized',
        price: Number(product.price) || 0,
        quantity: quantity,
        description: product.description || '',
        image_url: processedImageUrl,
        availability_status: availability_status,
        ready_for_sale: product.ready_for_sale,
        sku: product.sku || '',
        status: product.status || 'Available',
        age: product.age || '',
        inStock: quantity > 0,
        lastUpdated: product.updated_at || product.created_at,
        has_image: hasValidImage,
        has_custom_image: hasValidImage && product.image_url && product.image_url.trim() !== '',
        original_image_url: product.image_url || null,
        display_image_url: processedImageUrl
      }
    })

    // Update cache
    cachedProducts = formattedProducts
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
      dashboard_managed_only: true, // Indicate these are dashboard-managed products
      filtered_from_total: products.length, // Show how many were filtered out
      cached: false,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=120',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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