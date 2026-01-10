import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { email }: SendOtpRequest = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract domain from email
    const emailParts = email.toLowerCase().trim().split("@");
    if (emailParts.length !== 2) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const domain = emailParts[1];

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
      .eq("email", email.toLowerCase().trim())
      .eq("used", false);

    // Store new OTP
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email: email.toLowerCase().trim(),
      code: otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "JustOne <onboarding@resend.dev>",
      to: [email],
      subject: "Your JustOne verification code",
      html: `
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
      `,
    });

    console.log("OTP email sent:", emailResponse);

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
