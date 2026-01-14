import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
}

// Rate limiting: 3 requests per email per 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

// Maileroo API helper - uses v2 API format
async function sendEmailWithMaileroo(
  apiKey: string,
  from: { address: string; displayName: string },
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://smtp.maileroo.com/api/v2/emails", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          address: from.address,
          display_name: from.displayName,
        },
        to: {
          address: to,
        },
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();
    console.log("[send-waitlist-otp] Maileroo response:", JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[send-waitlist-otp] Maileroo error:", error?.message);
    return { success: false, error: error?.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-waitlist-otp] Request received", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mailerooApiKey = Deno.env.get("MAILEROO_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[send-waitlist-otp] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "server_config", message: "Server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!mailerooApiKey) {
      console.error("[send-waitlist-otp] MAILEROO_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "email_not_configured", message: "Email service not configured." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    let body: SendOtpRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_request", message: "Invalid request." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email } = body;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_email", message: "Email is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_email", message: "Please enter a valid email." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate university email domains
    const allowedDomains = [
      "ashoka.edu.in",
      "northwestern.edu", 
      "christuniversity.in",
      "christcollege.edu",
      "res.christuniversity.in",
      "mba.christuniversity.in"
    ];
    
    const emailDomain = normalizedEmail.split("@")[1];
    const isAllowedDomain = allowedDomains.some(domain => 
      emailDomain === domain || emailDomain.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      console.log("[send-waitlist-otp] Invalid domain:", emailDomain);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "invalid_domain", 
          message: "Please use your Ashoka University, Northwestern University, or Christ College email address." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-waitlist-otp] Email validated:", normalizedEmail);

    // Rate limiting
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const rateLimitKey = `waitlist-otp:${normalizedEmail}`;

    const { data: rateLimitData } = await supabase
      .from("otp_rate_limits")
      .select("id, request_count, window_start")
      .eq("email", rateLimitKey)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitData && rateLimitData.request_count >= MAX_REQUESTS_PER_WINDOW) {
      console.log("[send-waitlist-otp] Rate limited:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "rate_limited", 
          message: "Too many requests. Please wait a few minutes." 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update rate limit
    if (rateLimitData) {
      await supabase
        .from("otp_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("id", rateLimitData.id);
    } else {
      await supabase
        .from("otp_rate_limits")
        .insert({ email: rateLimitKey, request_count: 1, window_start: new Date().toISOString() });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", `waitlist:${normalizedEmail}`)
      .eq("used", false);

    // Store new OTP
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email: `waitlist:${normalizedEmail}`,
      code: otp,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
    });

    if (insertError) {
      console.error("[send-waitlist-otp] Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "otp_error", message: "Failed to generate code." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Maileroo
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #FAF4E8; padding: 40px; margin: 0; }
          .container { max-width: 480px; margin: 0 auto; background: white; padding: 48px; border-radius: 4px; }
          .code { font-size: 36px; font-weight: bold; color: #7A2E3A; letter-spacing: 8px; text-align: center; padding: 24px; background: #FAF4E8; border-radius: 4px; margin: 24px 0; }
          .footer { color: #666; font-size: 14px; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #1a1a1a; font-weight: normal;">Your verification code</h1>
          <p style="color: #666;">Enter this code to join the JustOne waitlist:</p>
          <div class="code">${otp}</div>
          <p style="color: #666;">This code expires in 10 minutes.</p>
          <div class="footer">
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <p style="color: #7A2E3A;">— JustOne</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("[send-waitlist-otp] Sending OTP email via Maileroo");

    const emailResult = await sendEmailWithMaileroo(
      mailerooApiKey,
      { address: "no-reply@justonematch.in", displayName: "JustOne" },
      normalizedEmail,
      "Your JustOne verification code",
      emailHtml
    );

    if (!emailResult.success) {
      console.error("[send-waitlist-otp] Maileroo send failed:", emailResult.error);
      return new Response(
        JSON.stringify({ success: false, error: "email_failed", message: "Failed to send verification email." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-waitlist-otp] OTP email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-waitlist-otp] Unhandled error:", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: "internal", message: "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
