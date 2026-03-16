
-- Add two-level category columns to sku_materials
ALTER TABLE public.sku_materials 
  ADD COLUMN IF NOT EXISTS main_category text NOT NULL DEFAULT '食材',
  ADD COLUMN IF NOT EXISTS sub_category text NOT NULL DEFAULT '其他';

-- Migrate existing data based on current category enum
UPDATE public.sku_materials SET main_category = '食材', sub_category = '咖啡豆' WHERE category = 'bean';
UPDATE public.sku_materials SET main_category = '食材', sub_category = '乳制品' WHERE category = 'milk';
UPDATE public.sku_materials SET main_category = '食材', sub_category = '糖浆' WHERE category = 'syrup';
UPDATE public.sku_materials SET main_category = '包材', sub_category = '杯具' WHERE category = 'packaging';
UPDATE public.sku_materials SET main_category = '食材', sub_category = '其他' WHERE category = 'other';
