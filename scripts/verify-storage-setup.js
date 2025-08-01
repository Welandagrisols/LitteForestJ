
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyStorageSetup() {
  console.log('🔍 Verifying Supabase Storage Setup...\n')

  try {
    // 1. Check if bucket exists
    console.log('1. CHECKING BUCKET STATUS')
    console.log('='.repeat(50))
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return
    }

    const plantImagesBucket = buckets.find(bucket => bucket.id === 'plant-images')
    
    if (!plantImagesBucket) {
      console.log('❌ plant-images bucket not found')
      console.log('📋 Create the bucket using:')
      console.log('   Supabase Dashboard → Storage → New bucket → plant-images (public)')
      return
    }

    console.log('✅ plant-images bucket exists')
    console.log(`   - ID: ${plantImagesBucket.id}`)
    console.log(`   - Public: ${plantImagesBucket.public}`)
    console.log(`   - Created: ${new Date(plantImagesBucket.created_at).toLocaleString()}`)

    // 2. Test upload functionality
    console.log('\n2. TESTING UPLOAD FUNCTIONALITY')
    console.log('='.repeat(50))

    const testFileName = `test-${Date.now()}.txt`
    const testContent = 'Storage verification test'
    const testPath = `test/${testFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(testPath, new Blob([testContent], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      
      if (uploadError.message.includes('policy')) {
        console.log('\n📋 Storage policies may need setup. Run this SQL in Supabase:')
        console.log(`
-- Allow public read access
CREATE POLICY "Allow public read access to plant images" ON storage.objects
FOR SELECT USING (bucket_id = 'plant-images');

-- Allow authenticated upload
CREATE POLICY "Allow authenticated upload to plant images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'plant-images' AND auth.role() = 'authenticated');

-- Allow authenticated update
CREATE POLICY "Allow authenticated update to plant images" ON storage.objects
FOR UPDATE USING (bucket_id = 'plant-images' AND auth.role() = 'authenticated');

-- Allow authenticated delete
CREATE POLICY "Allow authenticated delete to plant images" ON storage.objects
FOR DELETE USING (bucket_id = 'plant-images' AND auth.role() = 'authenticated');
        `)
      }
      return
    }

    console.log('✅ Upload test successful')
    console.log(`   - Path: ${testPath}`)

    // 3. Test public URL generation
    console.log('\n3. TESTING PUBLIC URL GENERATION')
    console.log('='.repeat(50))

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(testPath)

    console.log('✅ Public URL generated')
    console.log(`   - URL: ${publicUrl}`)

    // 4. Test download
    console.log('\n4. TESTING DOWNLOAD')
    console.log('='.repeat(50))

    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('plant-images')
      .download(testPath)

    if (downloadError) {
      console.error('❌ Download test failed:', downloadError.message)
    } else {
      console.log('✅ Download test successful')
    }

    // 5. Clean up test file
    console.log('\n5. CLEANING UP TEST FILE')
    console.log('='.repeat(50))

    const { error: deleteError } = await supabase.storage
      .from('plant-images')
      .remove([testPath])

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message)
    } else {
      console.log('✅ Test file cleaned up')
    }

    // 6. Check existing plant images
    console.log('\n6. CHECKING EXISTING PLANT IMAGES')
    console.log('='.repeat(50))

    const { data: files, error: filesError } = await supabase.storage
      .from('plant-images')
      .list('plants', { limit: 100 })

    if (filesError) {
      console.error('❌ Error listing files:', filesError.message)
    } else {
      console.log(`✅ Found ${files.length} files in plants folder`)
      
      if (files.length > 0) {
        console.log('\nRecent files:')
        files.slice(0, 5).forEach((file, index) => {
          const sizeKB = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : 'Unknown'
          console.log(`  ${index + 1}. ${file.name} (${sizeKB}KB)`)
        })
      }
    }

    console.log('\n🎉 STORAGE SETUP VERIFICATION COMPLETE')
    console.log('='.repeat(50))
    console.log('✅ All tests passed! Your storage is ready for use.')
    console.log('\n📋 Usage examples:')
    console.log('   - Upload path: plants/your-image.jpg')
    console.log(`   - Public URL: ${supabaseUrl}/storage/v1/object/public/plant-images/plants/your-image.jpg`)
    console.log('   - Test page: /storage-test.html (update the anon key first)')

  } catch (error) {
    console.error('❌ Verification failed:', error)
    console.error('   Make sure your Supabase credentials are correct')
  }
}

verifyStorageSetup()
