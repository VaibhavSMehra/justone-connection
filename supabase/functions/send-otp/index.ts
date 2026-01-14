import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
}

// Rate limiting configuration
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
    console.log("[send-otp] Maileroo response:", JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[send-otp] Maileroo error:", error?.message);
    return { success: false, error: error?.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailerooApiKey = Deno.env.get("MAILEROO_API_KEY");

    if (!mailerooApiKey) {
      console.error("MAILEROO_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: SendOtpRequest = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract domain from email
    const normalizedEmail = email.toLowerCase().trim();
    const emailParts = normalizedEmail.split("@");
    if (emailParts.length !== 2) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const domain = emailParts[1];

    // Rate limiting check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    // Get recent request count for this email
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from("otp_rate_limits")
      .select("id, request_count, window_start")
      .eq("email", normalizedEmail)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError);
    }

    if (rateLimitData && rateLimitData.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfter = Math.ceil(
        (new Date(rateLimitData.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 1000
      );
      return new Response(
        JSON.stringify({ 
          error: "rate_limited",
          message: "Too many verification code requests. Please try again later.",
          retry_after: Math.max(retryAfter, 60)
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(Math.max(retryAfter, 60)),
            ...corsHeaders 
          } 
        }
      );
    }

    // Update or create rate limit record
    if (rateLimitData) {
      await supabase
        .from("otp_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("id", rateLimitData.id);
    } else {
      await supabase
        .from("otp_rate_limits")
        .insert({ email: normalizedEmail, request_count: 1, window_start: new Date().toISOString() });
    }

    // Check if domain is allowed
    const { data: campuses, error: campusError } = await supabase
      .from("campuses")
      .select("id, name, allowed_domains");

    if (campusError) {
      console.error("Error fetching campuses:", campusError);
      return new Response(
        JSON.stringify({ error: "Failed to verify campus" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find matching campus
    const matchingCampus = campuses?.find((campus) =>
      campus.allowed_domains.includes(domain)
    );

    if (!matchingCampus) {
      return new Response(
        JSON.stringify({
          error: "domain_not_allowed",
          message: "JustOne is currently limited to select campuses. If you believe this is a mistake, join the waitlist."
        }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs for this email
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Store new OTP with attempts counter
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email: normalizedEmail,
      code: otp,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
    });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with OTP via Maileroo
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #FAF4E8; padding: 40px; }
          .container { max-width: 480px; margin: 0 auto; background: white; padding: 48px; border-radius: 4px; }
          .code { font-size: 36px; font-weight: bold; color: #7A2E3A; letter-spacing: 8px; text-align: center; padding: 24px; background: #FAF4E8; border-radius: 4px; margin: 24px 0; }
          .footer { color: #666; font-size: 14px; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #1a1a1a; font-weight: normal;">Your verification code</h1>
          <p style="color: #666;">Enter this code to verify your ${matchingCampus.name} email:</p>
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

    const emailResult = await sendEmailWithMaileroo(
      mailerooApiKey,
      { address: "no-reply@justonematch.in", displayName: "JustOne" },
      normalizedEmail,
      "Your JustOne verification code",
      emailHtml
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OTP email sent successfully to:", normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        campus_id: matchingCampus.id,
        campus_name: matchingCampus.name 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
