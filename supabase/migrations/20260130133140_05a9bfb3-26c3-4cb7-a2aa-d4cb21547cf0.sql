-- Fix RLS policies for sku_materials to allow public read
DROP POLICY IF EXISTS "Authenticated users can read materials" ON public.sku_materials;

CREATE POLICY "Anyone can read materials"
ON public.sku_materials
FOR SELECT
USING (true);

-- Fix RLS policies for sku_products to allow public read  
DROP POLICY IF EXISTS "Anyone can read active products" ON public.sku_products;

CREATE POLICY "Anyone can read products"
ON public.sku_products
FOR SELECT
USING (true);

-- Fix RLS policies for stores to allow public read
DROP POLICY IF EXISTS "Authenticated users can read stores" ON public.stores;

CREATE POLICY "Anyone can read stores"
ON public.stores
FOR SELECT
USING (true);

-- Fix RLS policies for bom_recipes to allow public read
DROP POLICY IF EXISTS "Authenticated users can read bom_recipes" ON public.bom_recipes;

CREATE POLICY "Anyone can read bom_recipes"
ON public.bom_recipes
FOR SELECT
USING (true);

-- Fix RLS policies for store_inventory to allow public read
DROP POLICY IF EXISTS "Admin or merchant can read store_inventory" ON public.store_inventory;

CREATE POLICY "Anyone can read store_inventory"
ON public.store_inventory
FOR SELECT
USING (true);