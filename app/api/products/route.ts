
import { NextRequest, NextResponse } from 'next/server'
import { supabase, isDemoMode } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Add CORS headers for website integration
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now, restrict later if needed
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

    // Fetch products that are ready for sale
    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('ready_for_sale', true)
      .order('plant_name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Transform the data to include availability status
    const transformedProducts = products?.map(product => {
      let availability_status = "Not Available"
      if (product.quantity >= 100) {
        availability_status = "Available"
      } else if (product.quantity >= 10) {
        availability_status = "Limited"
      }

      return {
        id: product.id,
        plant_name: product.plant_name,
        scientific_name: product.scientific_name,
        category: product.category,
        quantity: product.quantity,
        price: product.price,
        description: product.description || `High quality ${product.plant_name} seedlings`,
        image_url: product.image_url || '/placeholder.svg',
        availability_status,
        ready_for_sale: product.ready_for_sale,
        sku: product.sku
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
