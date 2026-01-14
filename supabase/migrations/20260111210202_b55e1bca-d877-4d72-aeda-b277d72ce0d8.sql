-- First, drop any trigger that might be using this function
DROP TRIGGER IF EXISTS enforce_response_user_id_trigger ON public.responses;
DROP TRIGGER IF EXISTS set_response_user_id ON public.responses;

-- Drop the function that's causing the authentication error
DROP FUNCTION IF EXISTS public.enforce_response_user_id();