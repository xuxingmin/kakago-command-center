
-- HQ warehouse inventory (physical stock at headquarters)
CREATE TABLE public.hq_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  current_qty numeric NOT NULL DEFAULT 0,
  weighted_avg_price numeric NOT NULL DEFAULT 0,
  batch_production_date date,
  batch_expiry_date date,
  batch_no text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_inventory" ON public.hq_inventory FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_inventory" ON public.hq_inventory FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- HQ inbound records (purchase from suppliers)
CREATE TABLE public.hq_inbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  supplier text NOT NULL DEFAULT '',
  purchase_qty numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (purchase_qty * unit_price) STORED,
  batch_no text,
  production_date date,
  expiry_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_inbound ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_inbound" ON public.hq_inbound FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_inbound" ON public.hq_inbound FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- HQ outbound records (dispatch to stores)
CREATE TABLE public.hq_outbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  logistics_no text,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_outbound ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_outbound" ON public.hq_outbound FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_outbound" ON public.hq_outbound FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Outbound line items
CREATE TABLE public.hq_outbound_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbound_id uuid NOT NULL REFERENCES public.hq_outbound(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_outbound_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_outbound_items" ON public.hq_outbound_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_outbound_items" ON public.hq_outbound_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Direct supply ledger
CREATE TABLE public.hq_direct_supply (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  supplier text NOT NULL DEFAULT '',
  order_qty numeric NOT NULL DEFAULT 0,
  confirmed_qty numeric,
  status text NOT NULL DEFAULT 'ordered',
  instruction_date date NOT NULL DEFAULT CURRENT_DATE,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_direct_supply ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_direct_supply" ON public.hq_direct_supply FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_direct_supply" ON public.hq_direct_supply FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- HQ inventory adjustment log
CREATE TABLE public.hq_inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.sku_materials(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'adjustment',
  ref_id uuid,
  previous_qty numeric NOT NULL DEFAULT 0,
  new_qty numeric NOT NULL DEFAULT 0,
  diff numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hq_inventory_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hq_inventory_logs" ON public.hq_inventory_logs FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage hq_inventory_logs" ON public.hq_inventory_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
