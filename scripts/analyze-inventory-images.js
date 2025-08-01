
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeInventoryImages() {
  console.log('🔍 ANALYZING INVENTORY IMAGES')
  console.log('=' .repeat(60))
  
  try {
    // 1. Fetch all inventory items with their image data
    console.log('1. FETCHING INVENTORY DATA WITH IMAGES')
    console.log('-'.repeat(40))
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching inventory:', error.message)
      return
    }

    console.log(`✅ Total inventory items: ${inventory.length}`)
    
    // 2. Analyze image data
    const itemsWithImages = inventory.filter(item => 
      item.image_url && 
      item.image_url.trim() !== '' && 
      item.image_url !== null
    )
    
    const itemsWithoutImages = inventory.filter(item => 
      !item.image_url || 
      item.image_url.trim() === '' || 
      item.image_url === null
    )

    console.log(`📸 Items WITH images: ${itemsWithImages.length}`)
    console.log(`📷 Items WITHOUT images: ${itemsWithoutImages.length}`)
    console.log(`📊 Image coverage: ${((itemsWithImages.length / inventory.length) * 100).toFixed(1)}%`)

    // 3. Categorize image sources
    console.log('\n2. IMAGE SOURCE ANALYSIS')
    console.log('-'.repeat(40))
    
    const imageSources = {
      supabase: [],
      external: [],
      relative: [],
      invalid: []
    }

    itemsWithImages.forEach(item => {
      const imageUrl = item.image_url.trim()
      
      if (imageUrl.includes('supabase.co') || imageUrl.includes('/storage/v1/object/public/')) {
        imageSources.supabase.push(item)
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        imageSources.external.push(item)
      } else if (imageUrl.startsWith('/') || !imageUrl.includes('://')) {
        imageSources.relative.push(item)
      } else {
        imageSources.invalid.push(item)
      }
    })

    console.log(`🏠 Supabase-hosted images: ${imageSources.supabase.length}`)
    console.log(`🌐 External URL images: ${imageSources.external.length}`)
    console.log(`📁 Relative path images: ${imageSources.relative.length}`)
    console.log(`❌ Invalid/malformed URLs: ${imageSources.invalid.length}`)

    // 4. Test image accessibility
    console.log('\n3. IMAGE ACCESSIBILITY TEST')
    console.log('-'.repeat(40))
    
    const testImages = itemsWithImages.slice(0, 10) // Test first 10 images
    let accessibleCount = 0
    let inaccessibleCount = 0

    for (const item of testImages) {
      try {
        const response = await fetch(item.image_url, { method: 'HEAD' })
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          const contentLength = response.headers.get('content-length')
          const sizeKB = contentLength ? (parseInt(contentLength) / 1024).toFixed(1) : 'Unknown'
          
          console.log(`✅ ${item.plant_name}`)
          console.log(`   URL: ${item.image_url}`)
          console.log(`   Status: ${response.status} ${response.statusText}`)
          console.log(`   Size: ${sizeKB}KB, Type: ${contentType}`)
          console.log(`   Added: ${new Date(item.created_at).toLocaleString()}`)
          console.log('')
          accessibleCount++
        } else {
          console.log(`❌ ${item.plant_name}: ${response.status} ${response.statusText}`)
          console.log(`   URL: ${item.image_url}`)
          console.log('')
          inaccessibleCount++
        }
      } catch (error) {
        console.log(`❌ ${item.plant_name}: Network error`)
        console.log(`   URL: ${item.image_url}`)
        console.log(`   Error: ${error.message}`)
        console.log('')
        inaccessibleCount++
      }
    }

    // 5. Detailed inventory with images
    console.log('\n4. DETAILED INVENTORY WITH IMAGES')
    console.log('-'.repeat(40))
    
    if (itemsWithImages.length > 0) {
      console.log('Recent items with images:')
      itemsWithImages.slice(0, 15).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.plant_name}`)
        console.log(`   ID: ${item.id}`)
        console.log(`   Category: ${item.category}`)
        console.log(`   Price: Ksh ${item.price}`)
        console.log(`   Quantity: ${item.quantity}`)
        console.log(`   Ready for Sale: ${item.ready_for_sale ? 'Yes' : 'No'}`)
        console.log(`   Image URL: ${item.image_url}`)
        console.log(`   Added: ${new Date(item.created_at).toLocaleString()}`)
        
        if (item.updated_at && item.updated_at !== item.created_at) {
          console.log(`   Last Updated: ${new Date(item.updated_at).toLocaleString()}`)
        }
      })
    }

    // 6. Check Supabase storage
    console.log('\n5. SUPABASE STORAGE ANALYSIS')
    console.log('-'.repeat(40))
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.log('❌ Cannot access storage buckets:', bucketsError.message)
      } else {
        const plantImagesBucket = buckets.find(bucket => bucket.id === 'plant-images')
        
        if (plantImagesBucket) {
          console.log('✅ Plant images bucket found')
          console.log(`   Public: ${plantImagesBucket.public}`)
          console.log(`   Created: ${new Date(plantImagesBucket.created_at).toLocaleString()}`)
          
          // List files in storage
          const { data: files, error: filesError } = await supabase.storage
            .from('plant-images')
            .list('plants', { limit: 50 })
          
          if (filesError) {
            console.log('❌ Cannot list storage files:', filesError.message)
          } else {
            console.log(`📁 Files in storage: ${files.length}`)
            
            if (files.length > 0) {
              console.log('\nStorage files:')
              files.forEach((file, index) => {
                const sizeKB = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : 'Unknown'
                console.log(`  ${index + 1}. ${file.name} (${sizeKB}KB)`)
                console.log(`      Uploaded: ${new Date(file.created_at).toLocaleString()}`)
              })
            }
          }
        } else {
          console.log('❌ Plant images bucket not found')
        }
      }
    } catch (storageError) {
      console.log('❌ Storage analysis failed:', storageError.message)
    }

    // 7. Summary and recommendations
    console.log('\n6. SUMMARY & RECOMMENDATIONS')
    console.log('=' .repeat(60))
    
    console.log(`📊 IMAGE STATISTICS:`)
    console.log(`   Total Items: ${inventory.length}`)
    console.log(`   With Images: ${itemsWithImages.length} (${((itemsWithImages.length / inventory.length) * 100).toFixed(1)}%)`)
    console.log(`   Without Images: ${itemsWithoutImages.length}`)
    console.log(`   Supabase Images: ${imageSources.supabase.length}`)
    console.log(`   External Images: ${imageSources.external.length}`)
    console.log(`   Accessible (tested): ${accessibleCount}/${testImages.length}`)
    
    console.log(`\n📝 IMAGE SOURCES:`)
    if (imageSources.supabase.length > 0) {
      console.log(`   🏠 Supabase Storage: Images uploaded through the app's image upload feature`)
    }
    if (imageSources.external.length > 0) {
      console.log(`   🌐 External URLs: Images linked from other websites`)
    }
    if (imageSources.relative.length > 0) {
      console.log(`   📁 Relative Paths: May need to be converted to full URLs`)
    }

    console.log(`\n🔧 HOW IMAGES ARE ADDED:`)
    console.log(`   1. Through the inventory management interface (Edit Item → Upload Image)`)
    console.log(`   2. By providing external image URLs when adding/editing items`)
    console.log(`   3. Auto-filled from similar plant entries`)
    
    if (itemsWithoutImages.length > 0) {
      console.log(`\n⚠️  ITEMS MISSING IMAGES:`)
      itemsWithoutImages.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.plant_name} (${item.category})`)
      })
      if (itemsWithoutImages.length > 10) {
        console.log(`   ... and ${itemsWithoutImages.length - 10} more`)
      }
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
  }
}

// Run the analysis
analyzeInventoryImages()
