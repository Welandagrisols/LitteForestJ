-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Allow public read access for plant images" ON storage.objects
FOR SELECT USING (bucket_id = 'plant-images');

CREATE POLICY "Allow authenticated users to upload plant images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'plant-images');

CREATE POLICY "Allow authenticated users to update plant images" ON storage.objects
FOR UPDATE USING (bucket_id = 'plant-images');

CREATE POLICY "Allow authenticated users to delete plant images" ON storage.objects
FOR DELETE USING (bucket_id = 'plant-images');
