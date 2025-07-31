
const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupStorageAutomated() {
  console.log('🚀 Setting up storage bucket automatically...\n')

  try {
    // Step 1: Check if bucket already exists
    console.log('1. Checking if plant-images bucket exists...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const existingBucket = buckets.find(bucket => bucket.id === 'plant-images')
    
    if (existingBucket) {
      console.log('✅ Bucket "plant-images" already exists')
    } else {
      // Step 2: Create the bucket
      console.log('2. Creating plant-images bucket...')
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('plant-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })

      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        return
      }
      console.log('✅ Bucket "plant-images" created successfully')
    }

    // Step 3: Test upload functionality
    console.log('3. Testing upload functionality...')
    
    // Create a small test file
    const testFileName = `test-${Date.now()}.txt`
    const testContent = 'This is a test file for storage verification'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(testFileName, new Blob([testContent], { type: 'text/plain' }))

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError)
      
      // Check if it's a policy error
      if (uploadError.message.includes('policy')) {
        console.log('\n📋 Storage policies may need to be set up manually:')
        console.log('   Go to Supabase Dashboard → Storage → Policies')
        console.log('   Create policies for public read and authenticated upload')
      }
      return
    }

    console.log('✅ Upload test successful')

    // Step 4: Test download functionality
    console.log('4. Testing download functionality...')
    
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('plant-images')
      .download(testFileName)

    if (downloadError) {
      console.error('❌ Download test failed:', downloadError)
      return
    }

    console.log('✅ Download test successful')

    // Step 5: Get public URL
    console.log('5. Testing public URL generation...')
    
    const { data: urlData } = supabase.storage
      .from('plant-images')
      .getPublicUrl(testFileName)

    if (urlData && urlData.publicUrl) {
      console.log('✅ Public URL generation successful')
      console.log('   Sample URL:', urlData.publicUrl)
    }

    // Step 6: Clean up test file
    console.log('6. Cleaning up test file...')
    
    const { error: deleteError } = await supabase.storage
      .from('plant-images')
      .remove([testFileName])

    if (deleteError) {
      console.warn('⚠️  Could not delete test file:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }

    console.log('\n🎉 Storage setup completed successfully!')
    console.log('✅ Bucket "plant-images" is ready for use')
    console.log('✅ Upload/download functionality verified')
    console.log('✅ Public URL generation working')
    
  } catch (error) {
    console.error('❌ Unexpected error during setup:', error)
  }
}

// Run the setup
setupStorageAutomated()
