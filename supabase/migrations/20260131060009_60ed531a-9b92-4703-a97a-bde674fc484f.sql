-- Add new columns to stores table
ALTER TABLE public.stores 
ADD COLUMN longitude numeric NOT NULL DEFAULT 0,
ADD COLUMN latitude numeric NOT NULL DEFAULT 0,
ADD COLUMN head_barista text NOT NULL DEFAULT '',
ADD COLUMN coffee_machine_model text NOT NULL DEFAULT '',
ADD COLUMN grinder_model text NOT NULL DEFAULT '',
ADD COLUMN store_description text NOT NULL DEFAULT '',
ADD COLUMN store_message text NOT NULL DEFAULT '';