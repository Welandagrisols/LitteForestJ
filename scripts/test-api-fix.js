
const fetch = require('node-fetch')

async function testAPI() {
  console.log('🧪 TESTING API RESPONSE')
  console.log('='.repeat(40))
  
  try {
    const response = await fetch('https://litteforest.vercel.app/api/products')
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ API returned ${data.products.length} products`)
      
      const withImages = data.products.filter(p => p.has_image === true)
      const withImageUrls = data.products.filter(p => p.image_url && !p.image_url.includes('unsplash'))
      
      console.log(`📸 Products with has_image=true: ${withImages.length}`)
      console.log(`🔗 Products with non-placeholder URLs: ${withImageUrls.length}`)
      
      if (withImages.length > 0) {
        console.log('\n✅ IMAGES ARE WORKING!')
        withImages.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.plant_name}: ${product.image_url}`)
        })
      } else {
        console.log('\n❌ NO IMAGES FOUND - Problem still exists')
        
        // Show first few products for debugging
        data.products.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.plant_name}`)
          console.log(`     has_image: ${product.has_image}`)
          console.log(`     original_image_url: ${product.original_image_url}`)
          console.log(`     image_url: ${product.image_url}`)
        })
      }
    } else {
      console.log('❌ API error:', data.error)
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testAPI()
