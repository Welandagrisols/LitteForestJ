
import { NextRequest, NextResponse } from 'next/server'
import { supabase, isDemoMode } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  // Add CORS headers for website integration
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.littleforest.co.ke',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    if (isDemoMode) {
      return NextResponse.json({
        success: false,
        error: 'Demo mode - inventory updates disabled'
      }, { status: 400 })
    }

    const body = await request.json()
    const { product_id, quantity_sold, customer_info } = body

    if (!product_id || !quantity_sold) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: product_id and quantity_sold' },
        { status: 400 }
      )
    }

    // First, check current inventory
    const { data: product, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', product_id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.quantity < quantity_sold) {
      return NextResponse.json(
        { success: false, error: 'Insufficient inventory' },
        { status: 400 }
      )
    }

    // Update inventory quantity
    const newQuantity = product.quantity - quantity_sold
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (updateError) {
      console.error('Error updating inventory:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update inventory' },
        { status: 500 }
      )
    }

    // Optional: Record the sale in sales table
    if (customer_info) {
      const saleData = {
        inventory_id: product_id,
        quantity: quantity_sold,
        total_amount: product.price * quantity_sold,
        sale_date: new Date().toISOString().split('T')[0],
        customer_name: customer_info.name || 'Website Customer',
        customer_contact: customer_info.contact || '',
        created_at: new Date().toISOString()
      }

      const { error: saleError } = await supabase
        .from('sales')
        .insert([saleData])

      if (saleError) {
        console.error('Error recording sale:', saleError)
        // Don't fail the request if sale recording fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      new_quantity: newQuantity,
      availability_status: newQuantity >= 100 ? 'Available' : newQuantity >= 10 ? 'Limited' : 'Not Available'
    }, { headers })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
