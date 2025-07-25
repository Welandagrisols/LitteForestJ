import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Rate limiting for update requests
const updateRateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkUpdateRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = updateRateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    updateRateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim()
  }
  return input
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown'
    if (!checkUpdateRateLimit(ip)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { status: 429 })
    }

    const body = await request.json()
    const { product_id, quantity_sold, customer_info } = body

    // Input validation and sanitization
    const sanitizedProductId = sanitizeInput(product_id)
    const sanitizedQuantity = parseInt(quantity_sold) || 0
    
    if (!sanitizedProductId || !sanitizedQuantity || sanitizedQuantity <= 0 || sanitizedQuantity > 1000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid product ID or quantity (max 1000 per order)' 
      }, { status: 400 })
    }

    // Sanitize customer info if provided
    const sanitizedCustomerInfo = customer_info ? {
      name: sanitizeInput(customer_info.name || ''),
      contact: sanitizeInput(customer_info.contact || ''),
      email: sanitizeInput(customer_info.email || ''),
      source: sanitizeInput(customer_info.source || 'Website')
    } : null

    // Get product information for validation only
    const { data: product, error: productError } = await supabase
      .from('inventory')
      .select('id, plant_name, quantity, price, ready_for_sale')
      .eq('id', sanitizedProductId)
      .eq('ready_for_sale', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found or not available for sale' 
      }, { status: 404 })
    }

    // Check if enough stock is available
    if (product.quantity < sanitizedQuantity) {
      return NextResponse.json({ 
        success: false, 
        error: `Only ${product.quantity} units available` 
      }, { status: 400 })
    }

    // Enhanced security headers
    const headers = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://littleforest.onrender.com' 
        : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Order inquiry processed successfully',
        product: {
          id: sanitizeInput(product.id),
          name: sanitizeInput(product.plant_name),
          available_quantity: Math.max(0, parseInt(product.quantity) || 0),
          price: Math.max(0, parseFloat(product.price) || 0)
        },
        note: 'Please contact us directly to complete your order'
      }), 
      { status: 200, headers }
    )

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
