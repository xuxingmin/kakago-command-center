-- Add new columns to sku_products table for enhanced product information
ALTER TABLE public.sku_products
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS spec_ml NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS attributes TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.sku_products.name_en IS 'Product English name';
COMMENT ON COLUMN public.sku_products.spec_ml IS 'Product specification in milliliters';
COMMENT ON COLUMN public.sku_products.description IS 'Product description/introduction';
COMMENT ON COLUMN public.sku_products.attributes IS 'Product attributes';
COMMENT ON COLUMN public.sku_products.notes IS 'Product notes/remarks';