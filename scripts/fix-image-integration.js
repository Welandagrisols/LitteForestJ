
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixImageIntegration() {
  console.log('🔧 Fixing image integration issues...\n')

  try {
    // 1. Check and fix storage bucket
    console.log('1. CHECKING STORAGE BUCKET STATUS')
    console.log('=' .repeat(50))
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError.message)
      if (bucketsError.message.includes('permission')) {
        console.log('⚠️  Storage permissions may need to be configured in Supabase dashboard')
      }
    } else {
      const plantImagesBucket = buckets.find(bucket => bucket.id === 'plant-images')
      
      if (plantImagesBucket) {
        console.log('✅ Plant images bucket exists')
        console.log(`   - Public: ${plantImagesBucket.public}`)
        console.log(`   - Created: ${new Date(plantImagesBucket.created_at).toLocaleString()}`)
      } else {
        console.log('❌ Plant images bucket not found - attempting to create...')
        
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('plant-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })

        if (createError) {
          console.error('❌ Failed to create bucket:', createError.message)
        } else {
          console.log('✅ Plant images bucket created successfully')
        }
      }
    }

    // 2. Check inventory items with images
    console.log('\n2. ANALYZING INVENTORY IMAGE DATA')
    console.log('=' .repeat(50))
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, plant_name, image_url, ready_for_sale')
      .eq('ready_for_sale', true)
      .order('plant_name')

    if (inventoryError) {
      console.error('❌ Error fetching inventory:', inventoryError.message)
      return
    }

    const itemsWithImages = inventory.filter(item => item.image_url && item.image_url.trim() !== '')
    
    console.log(`📊 Ready for sale items: ${inventory.length}`)
    console.log(`📊 Items with image URLs: ${itemsWithImages.length}`)
    
    if (itemsWithImages.length > 0) {
      console.log('\nItems with images:')
      itemsWithImages.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.plant_name}`)
        console.log(`     Image URL: ${item.image_url}`)
      })
    }

    // 3. Test image URL accessibility
    console.log('\n3. TESTING IMAGE URL ACCESSIBILITY')
    console.log('=' .repeat(50))
    
    for (let i = 0; i < Math.min(itemsWithImages.length, 5); i++) {
      const item = itemsWithImages[i]
      try {
        const response = await fetch(item.image_url, { method: 'HEAD' })
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          const contentLength = response.headers.get('content-length')
          const sizeKB = contentLength ? (parseInt(contentLength) / 1024).toFixed(1) : 'Unknown'
          console.log(`✅ ${item.plant_name}: ${response.status} OK`)
          console.log(`   Type: ${contentType}, Size: ${sizeKB}KB`)
        } else {
          console.log(`❌ ${item.plant_name}: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log(`❌ ${item.plant_name}: Network error - ${error.message}`)
      }
    }

    // 4. Test the API endpoint
    console.log('\n4. TESTING API ENDPOINT')
    console.log('=' .repeat(50))
    
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://litteforest.vercel.app/api/products'
        : 'http://localhost:5000/api/products'
      
      console.log(`Testing API: ${apiUrl}`)
      
      const apiResponse = await fetch(apiUrl)
      const apiData = await apiResponse.json()
      
      if (apiData.success) {
        const productsWithImages = apiData.products.filter(p => p.image_url && p.image_url !== null)
        const productsWithHasImage = apiData.products.filter(p => p.has_image === true)
        
        console.log(`✅ API returns ${apiData.products.length} products`)
        console.log(`📊 Products with image_url field: ${productsWithImages.length}`)
        console.log(`📊 Products with has_image=true: ${productsWithHasImage.length}`)
        
        console.log('\nFirst 3 products from API:')
        apiData.products.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.plant_name}`)
          console.log(`     has_image: ${product.has_image}`)
          console.log(`     image_url: ${product.image_url || 'null/undefined'}`)
          console.log(`     original_image_url: ${product.original_image_url || 'null/undefined'}`)
        })
      } else {
        console.log('❌ API returned error:', apiData.error)
      }
    } catch (error) {
      console.log('❌ Error testing API:', error.message)
    }

    // 5. Check storage policies
    console.log('\n5. CHECKING STORAGE POLICIES')
    console.log('=' .repeat(50))
    
    try {
      // Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('plant-images')
        .list('plants', { limit: 10 })
      
      if (filesError) {
        console.log('❌ Cannot list files in storage:', filesError.message)
        if (filesError.message.includes('policy')) {
          console.log('⚠️  Storage policies may need to be configured')
          console.log('   Run the following SQL in Supabase SQL Editor:')
          console.log(`
-- Enable RLS for storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plant images
CREATE POLICY "Allow public read access to plant images" ON storage.objects
FOR SELECT USING (bucket_id = 'plant-images');

-- Allow authenticated users to upload plant images
CREATE POLICY "Allow authenticated users to upload plant images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'plant-images');
`)
        }
      } else {
        console.log(`✅ Storage access working - found ${files.length} files`)
        if (files.length > 0) {
          console.log('Sample files:')
          files.slice(0, 3).forEach(file => {
            console.log(`  - ${file.name}`)
          })
        }
      }
    } catch (error) {
      console.log('❌ Error checking storage:', error.message)
    }

    // 6. Recommendations
    console.log('\n6. RECOMMENDATIONS')
    console.log('=' .repeat(50))
    
    console.log('To fix the integration issues:')
    console.log('1. ✅ Ensure storage bucket exists (checked above)')
    console.log('2. ✅ Verify image URLs are accessible (tested above)')
    console.log('3. ✅ Check API endpoint returns correct data (tested above)')
    
    if (itemsWithImages.length !== inventory.length) {
      console.log('4. ⚠️  Some ready-for-sale items are missing images')
      console.log('   - Use the Website Integration tab to add images to products')
    }
    
    console.log('5. 🔧 If images still don\'t show on website:')
    console.log('   - Check your website code is using the correct API endpoint')
    console.log('   - Ensure your website handles the image_url field correctly')
    console.log('   - Check browser console for any CORS errors')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixImageIntegration()
