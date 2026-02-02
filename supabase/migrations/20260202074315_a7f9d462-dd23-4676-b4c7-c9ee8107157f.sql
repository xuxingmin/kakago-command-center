-- Create settlement_status enum
CREATE TYPE public.settlement_status AS ENUM ('pending', 'confirmed', 'paid', 'completed');

-- Create financial_tx_type enum
CREATE TYPE public.financial_tx_type AS ENUM (
  'order_revenue',
  'refund',
  'material_purchase',
  'store_settlement',
  'coupon_cost',
  'other_income',
  'other_expense'
);

-- Create coupon_type enum
CREATE TYPE public.coupon_type AS ENUM ('fixed', 'discount', 'freebie');

-- Create coupon_status enum
CREATE TYPE public.coupon_status AS ENUM ('active', 'used', 'expired');

-- Create settlements table
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  order_count INTEGER DEFAULT 0,
  order_total NUMERIC DEFAULT 0,
  coupon_count INTEGER DEFAULT 0,
  coupon_cost NUMERIC DEFAULT 0,
  platform_fee_rate NUMERIC DEFAULT 0.05,
  platform_fee NUMERIC DEFAULT 0,
  settlement_amount NUMERIC DEFAULT 0,
  status public.settlement_status DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.financial_tx_type NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount NUMERIC NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.coupon_type NOT NULL,
  value NUMERIC NOT NULL,
  min_order NUMERIC DEFAULT 0,
  valid_days INTEGER DEFAULT 7,
  total_quota INTEGER,
  used_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_coupons table
CREATE TABLE public.user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status public.coupon_status DEFAULT 'active',
  received_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend orders table with coupon fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Settlements RLS: Admin can manage all, merchants can view their store's settlements
CREATE POLICY "Admin can manage all settlements" ON public.settlements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own store settlements" ON public.settlements
  FOR SELECT USING (public.has_store_access(auth.uid(), store_id));

-- Financial transactions RLS: Admin only
CREATE POLICY "Admin can manage financial transactions" ON public.financial_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coupons RLS: Admin can manage, all authenticated can read
CREATE POLICY "Admin can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT USING (status = 'active');

-- User coupons RLS: Users can manage their own coupons
CREATE POLICY "Users can view own coupons" ON public.user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all user coupons" ON public.user_coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can receive coupons" ON public.user_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_settlements_store_id ON public.settlements(store_id);
CREATE INDEX idx_settlements_period ON public.settlements(period_start, period_end);
CREATE INDEX idx_settlements_status ON public.settlements(status);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_store_id ON public.financial_transactions(store_id);
CREATE INDEX idx_financial_transactions_created_at ON public.financial_transactions(created_at);
CREATE INDEX idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON public.user_coupons(status);

-- Add updated_at trigger for settlements
CREATE TRIGGER update_settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for coupons
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();