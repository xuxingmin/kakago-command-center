-- ===========================================
-- KAKAGO 供应链系统数据库架构
-- ===========================================

-- 1. 产品表 (SKU Products)
CREATE TABLE public.sku_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 原料分类枚举
CREATE TYPE public.material_category AS ENUM ('bean', 'milk', 'packaging', 'syrup', 'other');

-- 3. 原物料表 (SKU Materials)
CREATE TABLE public.sku_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category material_category NOT NULL DEFAULT 'other',
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit_purchase TEXT NOT NULL DEFAULT '箱',
  unit_usage TEXT NOT NULL DEFAULT 'g',
  conversion_rate DECIMAL(12, 4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BOM 配方表 (Bill of Materials)
CREATE TABLE public.bom_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.sku_products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  usage_quantity DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, material_id)
);

-- 5. 门店状态枚举
CREATE TYPE public.store_status AS ENUM ('active', 'inactive', 'renovating');

-- 6. 门店表 (Stores)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  status store_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. 门店库存表 (Store Inventory)
CREATE TABLE public.store_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  current_quantity DECIMAL(12, 4) NOT NULL DEFAULT 0,
  theoretical_quantity DECIMAL(12, 4) NOT NULL DEFAULT 0,
  last_stocktake_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, material_id)
);

-- 8. 补货批次状态枚举
CREATE TYPE public.restock_status AS ENUM ('pending', 'approved', 'shipped', 'received', 'cancelled');

-- 9. 补货批次表 (Restock Batches)
CREATE TABLE public.restock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status restock_status NOT NULL DEFAULT 'pending',
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. 补货来源类型枚举
CREATE TYPE public.restock_source AS ENUM ('system_calc', 'merchant_add', 'manual');

-- 11. 补货明细表 (Restock Items)
CREATE TABLE public.restock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.restock_batches(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 4) NOT NULL DEFAULT 0,
  source_type restock_source NOT NULL DEFAULT 'system_calc',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. 盘点记录表 (Stocktake Records)
CREATE TABLE public.stocktake_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  theoretical_qty DECIMAL(12, 4) NOT NULL DEFAULT 0,
  actual_qty DECIMAL(12, 4) NOT NULL DEFAULT 0,
  difference_qty DECIMAL(12, 4) NOT NULL DEFAULT 0,
  difference_reason TEXT,
  stocktake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- 启用 RLS (Row Level Security)
-- ===========================================
ALTER TABLE public.sku_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktake_records ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS 策略 - 读取权限 (所有已认证用户可读)
-- ===========================================
CREATE POLICY "Authenticated users can read products" ON public.sku_products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read materials" ON public.sku_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read bom_recipes" ON public.bom_recipes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read stores" ON public.stores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read store_inventory" ON public.store_inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read restock_batches" ON public.restock_batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read restock_items" ON public.restock_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read stocktake_records" ON public.stocktake_records
  FOR SELECT TO authenticated USING (true);

-- ===========================================
-- RLS 策略 - 写入权限 (所有已认证用户可写，后续可通过角色细化)
-- ===========================================
CREATE POLICY "Authenticated users can insert products" ON public.sku_products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" ON public.sku_products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete products" ON public.sku_products
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert materials" ON public.sku_materials
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update materials" ON public.sku_materials
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete materials" ON public.sku_materials
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bom_recipes" ON public.bom_recipes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bom_recipes" ON public.bom_recipes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete bom_recipes" ON public.bom_recipes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stores" ON public.stores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stores" ON public.stores
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert store_inventory" ON public.store_inventory
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update store_inventory" ON public.store_inventory
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert restock_batches" ON public.restock_batches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update restock_batches" ON public.restock_batches
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert restock_items" ON public.restock_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert stocktake_records" ON public.stocktake_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- ===========================================
-- 自动更新 updated_at 触发器
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sku_products_updated_at
  BEFORE UPDATE ON public.sku_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sku_materials_updated_at
  BEFORE UPDATE ON public.sku_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_inventory_updated_at
  BEFORE UPDATE ON public.store_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restock_batches_updated_at
  BEFORE UPDATE ON public.restock_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();