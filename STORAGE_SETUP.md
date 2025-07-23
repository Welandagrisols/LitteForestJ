# Storage Setup for Plant Images

This guide explains how to set up Supabase Storage for uploading plant images directly from the app.

## 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Enter bucket name: `plant-images`
4. Make it **Public** (check the public option)
5. Click **Create bucket**

## 2. Set up Storage Policies

Run the following SQL in your Supabase SQL Editor:

\`\`\`sql
-- Enable RLS for storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plant images
CREATE POLICY "Allow public read access to plant images" ON storage.objects
FOR SELECT USING (bucket_id = 'plant-images');

-- Allow authenticated users to upload plant images
CREATE POLICY "Allow authenticated users to upload plant images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'plant-images');

-- Allow authenticated users to update plant images
CREATE POLICY "Allow authenticated users to update plant images" ON storage.objects
FOR UPDATE USING (bucket_id = 'plant-images');

-- Allow authenticated users to delete plant images
CREATE POLICY "Allow authenticated users to delete plant images" ON storage.objects
FOR DELETE USING (bucket_id = 'plant-images');
\`\`\`

## 3. Features

With this setup, your app now supports:

- **Direct image upload** from any device (phone, laptop, tablet)
- **Image preview** before saving
- **File validation** (image types only, 5MB max)
- **Automatic URL generation** for the uploaded images
- **Public access** to images for your landing page
- **Fallback to manual URL input** if needed

## 4. Usage

1. **Adding new plants**: Use the image upload area in the "Add Inventory" form
2. **Editing existing plants**: Update images in the "Edit" form
3. **Mobile-friendly**: Works great on phones and tablets
4. **Website integration**: Images are automatically available for your landing page

## 5. File Organization

Images are stored in the following structure:
\`\`\`
plant-images/
├── plants/
│   ├── 1734567890-abc123.jpg
│   ├── 1734567891-def456.png
│   └── ...
\`\`\`

Each file gets a unique timestamp-based name to prevent conflicts.
