-- Remove SELECT policy from responses table (users should NOT be able to read their own responses)
DROP POLICY IF EXISTS "Users can view their own responses" ON public.responses;

-- Add a hash column for integrity verification
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS responses_hash text;

-- Create trigger function to enforce user_id = auth.uid() on insert/update
CREATE OR REPLACE FUNCTION public.enforce_response_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On insert or update, force user_id to be the authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Create trigger on responses table
DROP TRIGGER IF EXISTS enforce_response_user_id_trigger ON public.responses;
CREATE TRIGGER enforce_response_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_response_user_id();