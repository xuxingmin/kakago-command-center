
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id),
  target_segment TEXT NOT NULL DEFAULT 'all',
  target_store_ids UUID[],
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage campaigns"
  ON public.marketing_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active campaigns"
  ON public.marketing_campaigns FOR SELECT
  TO authenticated
  USING (status = 'active');
