-- Add new campuses for JGU and CHRIST
INSERT INTO public.campuses (name, allowed_domains)
VALUES 
  ('O.P. Jindal Global University', ARRAY['jgu.edu.in']),
  ('CHRIST University Bangalore', ARRAY['christuniversity.in'])
ON CONFLICT DO NOTHING;

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
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

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can insert roles (or service role)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin_emails table to store allowed admin emails
CREATE TABLE public.admin_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin emails list
CREATE POLICY "Admins can view admin emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert the two admin emails
INSERT INTO public.admin_emails (email)
VALUES 
  ('vaibhavmehra2027@u.northwestern.edu'),
  ('antonyvincent2026@u.northwestern.edu');