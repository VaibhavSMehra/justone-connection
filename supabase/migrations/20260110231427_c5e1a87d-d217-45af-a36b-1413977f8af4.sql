-- Add attempts column to otp_codes table for tracking verification attempts
ALTER TABLE public.otp_codes ADD COLUMN attempts integer NOT NULL DEFAULT 0;

-- Create a table to track OTP send rate limiting
CREATE TABLE public.otp_rate_limits (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_otp_rate_limits_email_window ON public.otp_rate_limits (email, window_start);
CREATE INDEX idx_otp_codes_email_used ON public.otp_codes (email, used);

-- Enable RLS on rate limits table (only accessed by service role)
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - table only accessed via service role from edge functions