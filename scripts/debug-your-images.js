
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugYourImages() {
  console.log('🔍 DEBUGGING YOUR SPECIFIC IMAGE SITUATION')
  console.log('='.repeat(60))

  try {
    // 1. Get inventory with images
    console.log('1. FETCHING INVENTORY WITH IMAGES')
    console.log('-'.repeat(40))
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('id, plant_name, image_url, ready_for_sale')
      .eq('ready_for_sale', true)
      .not('image_url', 'is', null)
      .order('plant_name')

    if (error) {
      console.error('❌ Error fetching inventory:', error.message)
      return
    }

    const itemsWithImages = inventory.filter(item => 
      item.image_url && 
      item.image_url.trim() !== '' && 
      item.image_url !== null
    )

    console.log(`📊 Total ready-for-sale items: ${inventory.length}`)
    console.log(`📸 Items with image_url field filled: ${itemsWithImages.length}`)

    if (itemsWithImages.length === 0) {
      console.log('❌ No items found with image URLs!')
      return
    }

    // 2. Show raw image data
    console.log('\n2. RAW IMAGE DATA FROM YOUR DATABASE')
    console.log('-'.repeat(40))
    
    itemsWithImages.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.plant_name}`)
      console.log(`   Raw image_url: "${item.image_url}"`)
      console.log(`   Length: ${item.image_url.length} characters`)
      console.log(`   Starts with: ${item.image_url.substring(0, 50)}...`)
      console.log('')
    })

    // 3. Test what the API does with these URLs
    console.log('3. TESTING API PROCESSING OF YOUR IMAGE URLS')
    console.log('-'.repeat(40))
    
    for (const item of itemsWithImages.slice(0, 3)) {
      console.log(`\n📸 Processing: ${item.plant_name}`)
      console.log(`   Original URL: ${item.image_url}`)
      
      // Simulate the API's image processing logic
      const imageUrl = item.image_url.trim()
      let processedImageUrl = null
      let hasValidImage = false
      
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        processedImageUrl = imageUrl
        hasValidImage = true
        console.log(`   ✅ Full URL detected`)
      } else if (imageUrl.startsWith('/storage/v1/object/public/')) {
        processedImageUrl = `${supabaseUrl}${imageUrl}`
        hasValidImage = true
        console.log(`   ✅ Supabase storage path detected`)
      } else if (imageUrl.startsWith('/')) {
        processedImageUrl = `${supabaseUrl}/storage/v1/object/public/plant-images${imageUrl}`
        hasValidImage = true
        console.log(`   ✅ Relative path detected`)
      } else {
        processedImageUrl = `${supabaseUrl}/storage/v1/object/public/plant-images/plants/${imageUrl}`
        hasValidImage = true
        console.log(`   ✅ Filename detected`)
      }
      
      console.log(`   Processed URL: ${processedImageUrl}`)
      console.log(`   Has valid image: ${hasValidImage}`)
      
      // Test if the processed URL works
      try {
        const response = await fetch(processedImageUrl, { method: 'HEAD' })
        if (response.ok) {
          console.log(`   🎉 IMAGE ACCESSIBLE: ${response.status} OK`)
        } else {
          console.log(`   ❌ IMAGE NOT ACCESSIBLE: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log(`   ❌ NETWORK ERROR: ${error.message}`)
      }
    }

    // 4. Test the actual API endpoint
    console.log('\n4. TESTING YOUR ACTUAL API ENDPOINT')
    console.log('-'.repeat(40))
    
    try {
      const apiUrl = 'https://litteforest.vercel.app/api/products'
      console.log(`Making request to: ${apiUrl}`)
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ API returned ${data.products.length} products`)
        
        const apiItemsWithImages = data.products.filter(p => p.has_image === true)
        const apiItemsWithImageUrls = data.products.filter(p => p.image_url && !p.image_url.includes('unsplash'))
        
        console.log(`📊 API items marked has_image=true: ${apiItemsWithImages.length}`)
        console.log(`📊 API items with non-fallback URLs: ${apiItemsWithImageUrls.length}`)
        
        if (apiItemsWithImages.length > 0) {
          console.log('\nFirst 3 API products with images:')
          apiItemsWithImages.slice(0, 3).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.plant_name}`)
            console.log(`     has_image: ${product.has_image}`)
            console.log(`     image_url: ${product.image_url}`)
            console.log(`     original_image_url: ${product.original_image_url}`)
          })
        } else {
          console.log('❌ NO PRODUCTS WITH has_image=true FROM API!')
          console.log('\nFirst 3 API products (showing fallback situation):')
          data.products.slice(0, 3).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.plant_name}`)
            console.log(`     has_image: ${product.has_image}`)
            console.log(`     image_url: ${product.image_url}`)
            console.log(`     original_image_url: ${product.original_image_url}`)
          })
        }
      } else {
        console.log('❌ API returned error:', data.error)
      }
    } catch (error) {
      console.log('❌ Error testing API:', error.message)
    }

    // 5. Diagnosis and fix recommendations
    console.log('\n5. DIAGNOSIS AND RECOMMENDATIONS')
    console.log('-'.repeat(40))
    
    if (itemsWithImages.length > 0) {
      console.log('✅ You DO have images in your database')
      console.log('🔍 The problem is likely in the API processing logic')
      console.log('\nPossible issues:')
      console.log('1. Image URLs are stored in a format the API doesn\'t recognize')
      console.log('2. The API\'s hasValidImage logic is too strict')
      console.log('3. Image URLs point to files that don\'t exist in Supabase storage')
      console.log('4. CORS issues preventing image access')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugYourImages()
