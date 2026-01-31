-- Add delete policy for stores table
CREATE POLICY "Authenticated users can delete stores" 
ON public.stores 
FOR DELETE 
USING (true);