ALTER TABLE public.sku_materials
  ADD COLUMN min_package_unit numeric NOT NULL DEFAULT 1,
  ADD COLUMN full_capacity numeric NOT NULL DEFAULT 0;