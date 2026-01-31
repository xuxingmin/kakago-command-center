-- 创建订单状态枚举
CREATE TYPE public.order_status AS ENUM ('pending', 'making', 'delivering', 'completed', 'cancelled');

-- 创建订单表
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_phone TEXT,
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- 启用RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS策略：任何人可读取订单（用于实时监控）
CREATE POLICY "Anyone can read orders"
  ON public.orders FOR SELECT
  USING (true);

-- RLS策略：允许插入订单（客户端下单）
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- RLS策略：允许更新订单状态
CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- 自动更新 updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 启用Realtime实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;