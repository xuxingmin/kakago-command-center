-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'public_user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role, store_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has access to a specific store
CREATE OR REPLACE FUNCTION public.has_store_access(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'admin' OR (role = 'merchant' AND store_id = _store_id))
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update store_inventory RLS policies for role-based access
DROP POLICY IF EXISTS "Authenticated users can read store_inventory" ON public.store_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert store_inventory" ON public.store_inventory;
DROP POLICY IF EXISTS "Authenticated users can update store_inventory" ON public.store_inventory;

CREATE POLICY "Admin or merchant can read store_inventory"
ON public.store_inventory
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_store_access(auth.uid(), store_id)
);

CREATE POLICY "Admin or merchant can insert store_inventory"
ON public.store_inventory
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_store_access(auth.uid(), store_id)
);

CREATE POLICY "Admin or merchant can update store_inventory"
ON public.store_inventory
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_store_access(auth.uid(), store_id)
);

-- Update sku_products policies for public read access
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.sku_products;

CREATE POLICY "Anyone can read active products"
ON public.sku_products
FOR SELECT
USING (is_active = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admin can manage products"
ON public.sku_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime on store_inventory for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_inventory;