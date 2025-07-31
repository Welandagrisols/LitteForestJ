
const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkImageStorage() {
  console.log('🔍 Checking image storage status...\n')
  
  try {
    // 1. Check if storage bucket exists
    console.log('1. Checking storage bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error fetching buckets:', bucketsError.message)
      return
    }
    
    const plantImagesBucket = buckets.find(bucket => bucket.id === 'plant-images')
    if (plantImagesBucket) {
      console.log('✅ Plant images bucket exists and is public:', plantImagesBucket.public)
    } else {
      console.log('❌ Plant images bucket not found')
      return
    }
    
    // 2. Check files in bucket
    console.log('\n2. Checking files in bucket...')
    const { data: files, error: filesError } = await supabase.storage
      .from('plant-images')
      .list('plants', { limit: 100 })
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError.message)
    } else {
      console.log(`✅ Found ${files.length} files in storage`)
      if (files.length > 0) {
        console.log('Recent files:')
        files.slice(0, 5).forEach(file => {
          console.log(`  - ${file.name} (${(file.metadata?.size / 1024).toFixed(1)}KB)`)
        })
      }
    }
    
    // 3. Check inventory table for image URLs
    console.log('\n3. Checking inventory table for image URLs...')
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, plant_name, image_url')
      .not('image_url', 'is', null)
      .limit(10)
    
    if (inventoryError) {
      console.error('❌ Error fetching inventory:', inventoryError.message)
    } else {
      const itemsWithImages = inventory.filter(item => item.image_url && item.image_url.trim() !== '')
      console.log(`✅ Found ${itemsWithImages.length} inventory items with image URLs`)
      
      if (itemsWithImages.length > 0) {
        console.log('Sample items with images:')
        itemsWithImages.slice(0, 3).forEach(item => {
          console.log(`  - ${item.plant_name}: ${item.image_url}`)
        })
      }
    }
    
    // 4. Test image accessibility
    console.log('\n4. Testing image accessibility...')
    if (inventory && inventory.length > 0) {
      const itemWithImage = inventory.find(item => item.image_url && item.image_url.trim() !== '')
      if (itemWithImage) {
        try {
          const response = await fetch(itemWithImage.image_url)
          if (response.ok) {
            console.log(`✅ Sample image accessible: ${response.status} ${response.statusText}`)
          } else {
            console.log(`❌ Sample image not accessible: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.log(`❌ Error accessing sample image: ${error.message}`)
        }
      } else {
        console.log('ℹ️ No inventory items with images to test')
      }
    }
    
    // 5. Check API endpoint
    console.log('\n5. Testing API endpoint...')
    try {
      const apiResponse = await fetch('https://litteforest.vercel.app/api/products')
      const apiData = await apiResponse.json()
      
      if (apiData.success) {
        const productsWithImages = apiData.products.filter(p => p.image_url)
        console.log(`✅ API returns ${apiData.products.length} products, ${productsWithImages.length} with images`)
        
        if (productsWithImages.length > 0) {
          console.log('Sample products with images from API:')
          productsWithImages.slice(0, 3).forEach(product => {
            console.log(`  - ${product.plant_name}: ${product.has_image ? '✅' : '❌'} image`)
          })
        }
      } else {
        console.log('❌ API returned error:', apiData.error)
      }
    } catch (error) {
      console.log('❌ Error testing API:', error.message)
    }
    
    console.log('\n📊 Summary:')
    console.log('- Storage bucket: ' + (plantImagesBucket ? '✅ Active' : '❌ Missing'))
    console.log('- Files in storage: ' + (files ? `✅ ${files.length} files` : '❌ Error'))
    console.log('- Inventory with images: ' + (inventory ? `✅ ${inventory.filter(i => i.image_url).length} items` : '❌ Error'))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkImageStorage()
