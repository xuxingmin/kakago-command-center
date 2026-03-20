
-- Create application status enum
CREATE TYPE public.join_application_status AS ENUM ('pending_contact', 'invited', 'submitted', 'completed');

-- Create join_applications table
CREATE TABLE public.join_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  status public.join_application_status NOT NULL DEFAULT 'pending_contact',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  store_name TEXT,
  store_address TEXT,
  store_location_lat NUMERIC,
  store_location_lng NUMERIC,
  store_front_photo TEXT,
  store_interior_photo TEXT,
  business_intro TEXT,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.join_applications ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage join applications"
  ON public.join_applications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can insert (from customer-facing form)
CREATE POLICY "Anyone can submit join application"
  ON public.join_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Seed example data for each status
INSERT INTO public.join_applications (phone, status, created_at, store_name, store_address, business_intro) VALUES
  ('13912345678', 'pending_contact', now() - interval '3 days', NULL, NULL, NULL),
  ('13887654321', 'invited', now() - interval '2 days', NULL, NULL, NULL),
  ('13811112222', 'submitted', now() - interval '1 day', '望京旗舰店', '北京市朝阳区望京SOHO T1', '专注精品咖啡，拥有5年咖啡行业经验，计划打造社区精品咖啡馆。'),
  ('13866668888', 'completed', now() - interval '5 days', '三里屯概念店', '北京市朝阳区三里屯太古里南区', '连锁咖啡品牌运营经验，目标客群为年轻白领。');
