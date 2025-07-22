import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { product_id, quantity_sold, customer_info } = await request.json()

    if (!product_id || !quantity_sold || quantity_sold <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid product ID or quantity' 
      }, { status: 400 })
    }

    // Get product information for validation only
    const { data: product, error: productError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 })
    }

    // Check if enough stock is available
    if (product.quantity < quantity_sold) {
      return NextResponse.json({ 
        success: false, 
        error: `Only ${product.quantity} units available` 
      }, { status: 400 })
    }

    // Return success with product info (no inventory update)
    const headers = {
    'Access-Control-Allow-Origin': 'https://litteforest.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
    return new NextResponse(
      JSON.stringify({
      success: true,
      message: 'Order processed successfully',
      product: {
        id: product.id,
        name: product.plant_name,
        available_quantity: product.quantity,
        price: product.price
      }
    }), {status: 200, headers: headers}
    )

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}