-- Create inventory_logs table for tracking manual corrections
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  material_id UUID NOT NULL REFERENCES public.sku_materials(id),
  type TEXT NOT NULL DEFAULT 'manual_correction',
  previous_qty NUMERIC NOT NULL DEFAULT 0,
  new_qty NUMERIC NOT NULL DEFAULT 0,
  diff NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read inventory_logs"
ON public.inventory_logs
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert inventory_logs"
ON public.inventory_logs
FOR INSERT
WITH CHECK (true);

-- Add index for efficient queries
CREATE INDEX idx_inventory_logs_store_material ON public.inventory_logs(store_id, material_id);
CREATE INDEX idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);