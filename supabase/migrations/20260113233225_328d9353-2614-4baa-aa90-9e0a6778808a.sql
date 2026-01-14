-- Add encrypted photo column to responses table
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS photo_encrypted TEXT;