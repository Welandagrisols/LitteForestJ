
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    // Get ALL products from inventory
    const { data: allProducts, error: allError } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at')

    if (allError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch products',
        code: 'DATABASE_ERROR'
      }, { status: 500 })
    }

    // Categorize products
    const dashboardManaged = allProducts.filter(product => {
      const hasRequiredFields = product.plant_name && 
                               product.category && 
                               product.price !== null && 
                               product.quantity !== null
      
      const hasProperTimestamps = product.created_at && product.updated_at
      const hasItemType = product.item_type === 'Plant' || product.item_type === 'Honey' || product.item_type === 'Consumable'
      
      return hasRequiredFields && hasProperTimestamps && hasItemType
    })

    const manuallyCreated = allProducts.filter(product => {
      const hasRequiredFields = product.plant_name && 
                               product.category && 
                               product.price !== null && 
                               product.quantity !== null
      
      const hasProperTimestamps = product.created_at && product.updated_at
      const hasItemType = product.item_type === 'Plant' || product.item_type === 'Honey' || product.item_type === 'Consumable'
      
      return !(hasRequiredFields && hasProperTimestamps && hasItemType)
    })

    const readyForSaleDashboard = dashboardManaged.filter(p => p.ready_for_sale === true && p.quantity > 0)
    const readyForSaleManual = manuallyCreated.filter(p => p.ready_for_sale === true && p.quantity > 0)

    return NextResponse.json({
      success: true,
      summary: {
        total_products: allProducts.length,
        dashboard_managed: dashboardManaged.length,
        manually_created: manuallyCreated.length,
        api_serving_dashboard_only: readyForSaleDashboard.length,
        api_would_serve_manual: readyForSaleManual.length
      },
      dashboard_products: readyForSaleDashboard.map(p => ({
        id: p.id,
        name: p.plant_name,
        category: p.category,
        quantity: p.quantity,
        price: p.price,
        created_via: 'Dashboard',
        created_at: p.created_at
      })),
      manual_products: readyForSaleManual.map(p => ({
        id: p.id,
        name: p.plant_name,
        category: p.category,
        quantity: p.quantity,
        price: p.price,
        created_via: 'Manual/Website',
        created_at: p.created_at,
        missing_fields: {
          item_type: !p.item_type,
          proper_timestamps: !p.created_at || !p.updated_at
        }
      })),
      message: "API now serves ONLY dashboard-managed products"
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: error.message
    }, { status: 500 })
  }
}
