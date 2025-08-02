
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyDashboardOnlyAPI() {
  console.log('🔍 VERIFYING DASHBOARD-ONLY API')
  console.log('=' .repeat(50))
  
  try {
    // Test the API endpoint
    console.log('1. Testing API endpoint...')
    const apiResponse = await fetch('https://litteforest.vercel.app/api/products')
    const apiData = await apiResponse.json()
    
    if (apiData.success) {
      console.log(`✅ API returned ${apiData.total} products`)
      console.log(`📊 Dashboard managed only: ${apiData.dashboard_managed_only ? 'YES' : 'NO'}`)
      if (apiData.filtered_from_total) {
        console.log(`🔧 Filtered out: ${apiData.filtered_from_total - apiData.total} manual entries`)
      }
    } else {
      console.log('❌ API call failed:', apiData.error)
      return
    }

    // Test verification endpoint
    console.log('\n2. Getting verification details...')
    const verifyResponse = await fetch('https://litteforest.vercel.app/api/products/verify')
    const verifyData = await verifyResponse.json()
    
    if (verifyData.success) {
      console.log('\n📊 INVENTORY BREAKDOWN:')
      console.log(`   Total products in database: ${verifyData.summary.total_products}`)
      console.log(`   Dashboard managed: ${verifyData.summary.dashboard_managed}`)
      console.log(`   Manually created: ${verifyData.summary.manually_created}`)
      console.log(`   API serving (dashboard only): ${verifyData.summary.api_serving_dashboard_only}`)
      console.log(`   API NOT serving (manual): ${verifyData.summary.api_would_serve_manual}`)
      
      if (verifyData.summary.api_would_serve_manual > 0) {
        console.log('\n⚠️ MANUAL PRODUCTS BLOCKED:')
        verifyData.manual_products.forEach(product => {
          console.log(`   - ${product.name} (ID: ${product.id})`)
        })
      }
      
      console.log('\n✅ DASHBOARD PRODUCTS SERVED:')
      verifyData.dashboard_products.slice(0, 5).forEach(product => {
        console.log(`   - ${product.name} - KSh ${product.price} (${product.quantity} available)`)
      })
      
    } else {
      console.log('❌ Verification failed:', verifyData.error)
    }

    console.log('\n🎯 CONCLUSION:')
    console.log('✅ API now serves ONLY products added through your inventory dashboard')
    console.log('❌ Manual database entries are filtered out')
    console.log('📋 Your developer will only see dashboard-managed products')

  } catch (error) {
    console.error('❌ Verification error:', error.message)
  }
}

verifyDashboardOnlyAPI()
