-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create water_source_gallery table
CREATE TABLE IF NOT EXISTS public.water_source_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spring_name VARCHAR(255) NOT NULL,
  media_url TEXT,
  media_type VARCHAR(50) DEFAULT 'image',
  story TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create green_champions_gallery table
CREATE TABLE IF NOT EXISTS public.green_champions_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name VARCHAR(255) NOT NULL,
  media_url TEXT,
  story TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.water_source_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_champions_gallery ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.water_source_gallery
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.green_champions_gallery
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_water_source_display_order ON public.water_source_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_green_champions_display_order ON public.green_champions_gallery(display_order);

-- 1. Create water_source_gallery table
CREATE TABLE IF NOT EXISTS public.water_source_gallery (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 spring_name TEXT,
 media_url TEXT NOT NULL,
 media_type TEXT NOT NULL,
 story TEXT,
 display_order INTEGER DEFAULT 0,
 is_active BOOLEAN DEFAULT true,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create green_champions_gallery table
CREATE TABLE IF NOT EXISTS public.green_champions_gallery (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 school_name TEXT,
 media_url TEXT NOT NULL,
 story TEXT,
 display_order INTEGER DEFAULT 0,
 is_active BOOLEAN DEFAULT true,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_water_source_display_order ON public.water_source_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_water_source_active ON public.water_source_gallery(is_active);
CREATE INDEX IF NOT EXISTS idx_green_champions_display_order ON public.green_champions_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_green_champions_active ON public.green_champions_gallery(is_active);

-- 4. Enable RLS
ALTER TABLE public.water_source_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_champions_gallery ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users on water_source_gallery"
ON public.water_source_gallery
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on green_champions_gallery"
ON public.green_champions_gallery
FOR ALL USING (auth.role() = 'authenticated');

-- 6. Create RLS policies for public read access
CREATE POLICY "Enable read access for all users on water_source_gallery"
ON public.water_source_gallery
FOR SELECT USING (is_active = true);

CREATE POLICY "Enable read access for all users on green_champions_gallery"
ON public.green_champions_gallery
FOR SELECT USING (is_active = true);

-- 7. Migrate existing water spring data from impact_stories
-- Create entries in water_source_gallery using existing impact_stories data
INSERT INTO public.water_source_gallery (spring_name, media_url, media_type, story, display_order, is_active)
SELECT
 title as spring_name,
 'https://placeholder-url.com/spring-image.jpg' as media_url,
 'image' as media_type,
 text as story,
 display_order,
 is_published as is_active
FROM public.impact_stories
WHERE category = 'water'
ON CONFLICT (id) DO NOTHING;

-- 8. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_water_source_gallery_updated_at ON public.water_source_gallery;
CREATE TRIGGER update_water_source_gallery_updated_at
BEFORE UPDATE ON public.water_source_gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_green_champions_gallery_updated_at ON public.green_champions_gallery;
CREATE TRIGGER update_green_champions_gallery_updated_at
BEFORE UPDATE ON public.green_champions_gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Add comment to document the migration
COMMENT ON TABLE public.water_source_gallery IS 'Green Towns Initiative - Water sources and springs gallery';
COMMENT ON TABLE public.green_champions_gallery IS 'Green Towns Initiative - Schools and green champions gallery';