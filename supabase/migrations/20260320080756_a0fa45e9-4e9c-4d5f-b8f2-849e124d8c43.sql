
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS kaka_bean_discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kaka_bean_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '微信支付',
  ADD COLUMN IF NOT EXISTS bean_reward numeric DEFAULT 0;
