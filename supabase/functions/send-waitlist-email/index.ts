import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistRequest {
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
    console.log("[send-waitlist-email] Maileroo response:", JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[send-waitlist-email] Maileroo error:", error?.message);
    return { success: false, error: error?.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-waitlist-email] Request received", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mailerooApiKey = Deno.env.get("MAILEROO_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[send-waitlist-email] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "server_config_error",
          message: "Server configuration error. Please contact support." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!mailerooApiKey) {
      console.error("[send-waitlist-email] MAILEROO_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "email_service_not_configured",
          message: "Email service is not configured. Please add MAILEROO_API_KEY to secrets." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Parse and validate request body
    let body: WaitlistRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[send-waitlist-email] Invalid JSON body");
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_request", message: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email } = body;

    // 3. Validate email format
    if (!email || typeof email !== "string") {
      console.error("[send-waitlist-email] Email missing or invalid type");
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_email", message: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.error("[send-waitlist-email] Invalid email format:", normalizedEmail);
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_email", message: "Please enter a valid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-waitlist-email] Email validated:", normalizedEmail);

    // 4. Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Rate limiting check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from("otp_rate_limits")
      .select("id, request_count, window_start")
      .eq("email", `waitlist:${normalizedEmail}`)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.error("[send-waitlist-email] Rate limit check error:", rateLimitError);
    }

    if (rateLimitData && rateLimitData.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfter = Math.ceil(
        (new Date(rateLimitData.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 1000
      );
      console.log("[send-waitlist-email] Rate limited:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "rate_limited",
          message: "You've already signed up. Check your inbox!",
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

    // 6. Update or create rate limit record
    if (rateLimitData) {
      await supabase
        .from("otp_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("id", rateLimitData.id);
    } else {
      await supabase
        .from("otp_rate_limits")
        .insert({ 
          email: `waitlist:${normalizedEmail}`, 
          request_count: 1, 
          window_start: new Date().toISOString() 
        });
    }

    // 7. Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Georgia, 'Times New Roman', serif; 
            background: #FAF4E8; 
            margin: 0;
            padding: 40px 20px; 
            color: #1a1a1a;
          }
          .container { 
            max-width: 480px; 
            margin: 0 auto; 
            background: white; 
            padding: 48px; 
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          h1 {
            font-size: 24px;
            font-weight: normal;
            color: #1a1a1a;
            margin: 0 0 24px 0;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          .divider {
            width: 48px;
            height: 1px;
            background: #7A2E3A;
            opacity: 0.4;
            margin: 32px 0;
          }
          .footer {
            font-size: 14px;
            color: #999;
          }
          .signature {
            color: #7A2E3A;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're on the list.</h1>
          <p>Thank you for your interest in JustOne. We're building something thoughtful for meaningful connections on campus.</p>
          <p>We'll email you when the questionnaire opens for your campus. No spam, no noise—just one message when it matters.</p>
          <div class="divider"></div>
          <p class="footer">In the meantime, take a breath. Good things take time.</p>
          <p class="signature">— JustOne</p>
        </div>
      </body>
      </html>
    `;

    // 8. Send email via Maileroo
    console.log("[send-waitlist-email] Attempting to send email via Maileroo");
    
    const emailResult = await sendEmailWithMaileroo(
      mailerooApiKey,
      { address: "no-reply@justonematch.in", displayName: "JustOne" },
      normalizedEmail,
      "You're on the JustOne waitlist",
      emailHtml
    );

    if (!emailResult.success) {
      console.error("[send-waitlist-email] Maileroo send failed:", emailResult.error);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "email_send_failed",
          message: "Failed to send confirmation email. Please try again." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-waitlist-email] Email sent successfully to:", normalizedEmail);

    // 9. Return success
    return new Response(
      JSON.stringify({ 
        ok: true,
        message: "You're on the list. We'll email you when it opens."
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-waitlist-email] Unhandled error:", error?.message || error);
    console.error("[send-waitlist-email] Error stack:", error?.stack);
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: "internal_error",
        message: "Something went wrong. Please try again." 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
