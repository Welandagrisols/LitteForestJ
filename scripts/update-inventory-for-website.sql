-- Add new columns for website integration
ALTER TABLE IF EXISTS public.inventory 
ADD COLUMN IF NOT EXISTS ready_for_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster filtering of products ready for sale
CREATE INDEX IF NOT EXISTS idx_inventory_ready_for_sale ON public.inventory(ready_for_sale);

-- Update existing demo data to be ready for sale
UPDATE public.inventory 
SET ready_for_sale = true, 
    description = CONCAT('High quality ', plant_name, ' seedlings perfect for your garden')
WHERE quantity > 0;

-- Add comments
COMMENT ON COLUMN public.inventory.ready_for_sale IS 'Whether this item should appear on the website for sale';
COMMENT ON COLUMN public.inventory.description IS 'Short description for the website listing';
COMMENT ON COLUMN public.inventory.image_url IS 'URL of the product image for the website';
