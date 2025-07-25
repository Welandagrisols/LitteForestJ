import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Rate limiting - simple in-memory store
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(ip)

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  clientData.count++
  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'

  try {
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      )
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

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      )
    }

    const { productId, quantity, customerInfo } = body

    // Enhanced input validation
    if (!productId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        },
        { status: 400 }
      )
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Quantity is required',
          code: 'MISSING_QUANTITY'
        },
        { status: 400 }
      )
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Quantity must be a positive integer',
          code: 'INVALID_QUANTITY'
        },
        { status: 400 }
      )
    }

    if (quantity > 1000) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Quantity cannot exceed 1000 items per order',
          code: 'QUANTITY_TOO_HIGH'
        },
        { status: 400 }
      )
    }

    // Validate customer info if provided
    if (customerInfo) {
      if (customerInfo.name && typeof customerInfo.name !== 'string') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Customer name must be a string',
            code: 'INVALID_CUSTOMER_NAME'
          },
          { status: 400 }
        )
      }

      if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid email format',
            code: 'INVALID_EMAIL'
          },
          { status: 400 }
        )
      }
    }

    // Get current product with timeout
    const { data: product, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)

      if (fetchError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Inventory table not found',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch product information',
          code: 'FETCH_ERROR'
        },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check if product is available for sale
    if (!product.ready_for_sale) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Product is not available for sale',
          code: 'PRODUCT_NOT_AVAILABLE'
        },
        { status: 403 }
      )
    }

    // Check stock
    if (product.quantity < quantity) {
      return NextResponse.json(
        { 
          success: false,
          error: `Insufficient stock. Only ${product.quantity} items available.`,
          code: 'INSUFFICIENT_STOCK',
          availableQuantity: product.quantity
        },
        { status: 409 }
      )
    }

    // Update inventory atomically
    const newQuantity = product.quantity - quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update inventory',
          code: 'UPDATE_ERROR'
        },
        { status: 500 }
      )
    }

    // Record sale if customer info provided
    let saleRecorded = false
    if (customerInfo && customerInfo.name) {
      const { error: salesError } = await supabase
        .from('sales')
        .insert({
          inventory_id: productId,
          quantity: quantity,
          total_amount: Number(product.price) * quantity,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email || null,
          customer_phone: customerInfo.phone || null,
          sale_date: new Date().toISOString()
        })

      if (salesError) {
        console.error('Sales recording error:', salesError)
        // Don't fail the entire operation if sales recording fails
      } else {
        saleRecorded = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        productId,
        productName: product.plant_name,
        quantityOrdered: quantity,
        newQuantity,
        totalAmount: Number(product.price) * quantity,
        saleRecorded
      },
      responseTime: Date.now() - startTime
    }, {
      status: 200,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
          ? 'https://littleforest.onrender.com' 
          : '*',
      }
    })

  } catch (error: any) {
    console.error('API error:', error)

    // Handle specific error types
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
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}