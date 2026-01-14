import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  code: string;
}

const MAX_ATTEMPTS = 5;

const handler = async (req: Request): Promise<Response> => {
  console.log("[verify-waitlist-otp] Request received", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[verify-waitlist-otp] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "server_config", message: "Server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Parse request
    let body: VerifyOtpRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_request", message: "Invalid request." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, code } = body;

    if (!email || !code) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message: "Email and code are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `waitlist:${normalizedEmail}`;

    console.log("[verify-waitlist-otp] Verifying OTP for:", normalizedEmail);

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_codes")
      .select("id, code, attempts, expires_at")
      .eq("email", otpKey)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("[verify-waitlist-otp] DB error:", otpError);
      return new Response(
        JSON.stringify({ success: false, error: "db_error", message: "Verification failed." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!otpRecord) {
      console.log("[verify-waitlist-otp] No valid OTP found");
      return new Response(
        JSON.stringify({ success: false, error: "expired", message: "Code expired or not found. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      console.log("[verify-waitlist-otp] Max attempts exceeded");
      return new Response(
        JSON.stringify({ success: false, error: "max_attempts", message: "Too many attempts. Please request a new code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify code
    if (otpRecord.code !== code) {
      await supabase
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
      
      const remaining = MAX_ATTEMPTS - otpRecord.attempts - 1;
      console.log("[verify-waitlist-otp] Invalid code, attempts remaining:", remaining);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "invalid_code", 
          message: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    console.log("[verify-waitlist-otp] OTP verified successfully");

    // Determine campus from email domain
    const emailDomain = normalizedEmail.split("@")[1];
    let campusName = "Unknown";
    
    if (emailDomain.includes("ashoka")) {
      campusName = "Ashoka University";
    } else if (emailDomain.includes("northwestern")) {
      campusName = "Northwestern University";
    } else if (emailDomain.includes("christ")) {
      campusName = "Christ College";
    }

    // Get or create campus
    let campusId: string | null = null;
    const { data: campus } = await supabase
      .from("campuses")
      .select("id")
      .contains("allowed_domains", [emailDomain])
      .maybeSingle();

    if (campus) {
      campusId = campus.id;
    } else {
      // Create campus if it doesn't exist
      const { data: newCampus } = await supabase
        .from("campuses")
        .insert({ 
          name: campusName, 
          allowed_domains: [emailDomain] 
        })
        .select("id")
        .single();
      
      if (newCampus) {
        campusId = newCampus.id;
      }
    }

    // Create or get user using admin API
    let userId: string;
    let isNewUser = false;

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === normalizedEmail);

    if (existingUser) {
      userId = existingUser.id;
      console.log("[verify-waitlist-otp] Existing user found:", userId);
    } else {
      // Create new user with a random password (they'll use OTP to login)
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since we verified via OTP
      });

      if (createError || !newUser.user) {
        console.error("[verify-waitlist-otp] Failed to create user:", createError);
        return new Response(
          JSON.stringify({ success: false, error: "user_creation_failed", message: "Failed to create account." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("[verify-waitlist-otp] New user created:", userId);
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        email: normalizedEmail,
        campus_id: campusId,
        verified: true,
      });

      if (profileError) {
        console.error("[verify-waitlist-otp] Failed to create profile:", profileError);
        // Don't fail the whole request, profile can be created later
      }
    } else if (campusId) {
      // Update campus if needed
      await supabase
        .from("profiles")
        .update({ campus_id: campusId, verified: true })
        .eq("user_id", userId);
    }

    // Generate a magic link and immediately verify it to get session tokens
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkError || !linkData) {
      console.error("[verify-waitlist-otp] Failed to generate login link:", linkError);
      return new Response(
        JSON.stringify({ success: false, error: "link_failed", message: "Failed to generate session." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract token hash and verify it server-side to get session
    const hashedToken = linkData.properties.hashed_token;
    
    // Create anon client to verify the token (admin client can't do verifyOtp)
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (sessionError || !sessionData.session) {
      console.error("[verify-waitlist-otp] Failed to create session:", sessionError);
      return new Response(
        JSON.stringify({ success: false, error: "session_failed", message: "Failed to create session." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[verify-waitlist-otp] Session created for user");

    // Send welcome email for new users
    if (isNewUser && resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Georgia, serif; background: #FAF4E8; padding: 40px; margin: 0; }
            .container { max-width: 480px; margin: 0 auto; background: white; padding: 48px; border-radius: 4px; }
            h1 { color: #1a1a1a; font-weight: normal; margin: 0 0 24px 0; }
            p { color: #666; line-height: 1.6; margin: 0 0 16px 0; }
            .divider { width: 48px; height: 1px; background: #7A2E3A; opacity: 0.4; margin: 32px 0; }
            .signature { color: #7A2E3A; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to JustOne</h1>
            <p>Your email has been verified. You're now ready to complete the questionnaire and find your meaningful connection.</p>
            <p>This isn't about swiping through endless options. It's about depth, intention, and finding someone who truly aligns with who you are.</p>
            <div class="divider"></div>
            <p style="font-size: 14px; color: #999;">Take your time with the questionnaire. Your honest answers will help us find someone worth meeting.</p>
            <p class="signature">— JustOne</p>
          </div>
        </body>
        </html>
      `;

      try {
        let emailResponse = await resend.emails.send({
          from: "JustOne <no-reply@justone.in>",
          to: [normalizedEmail],
          subject: "Welcome to JustOne",
          html: welcomeHtml,
        });

        if (emailResponse?.error?.message?.includes("domain")) {
          emailResponse = await resend.emails.send({
            from: "JustOne <onboarding@resend.dev>",
            to: [normalizedEmail],
            subject: "Welcome to JustOne",
            html: welcomeHtml,
          });
        }

        console.log("[verify-waitlist-otp] Welcome email sent:", emailResponse?.data?.id);
      } catch (emailErr: any) {
        console.error("[verify-waitlist-otp] Failed to send welcome email:", emailErr?.message);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully!",
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
        email: normalizedEmail,
        isNewUser
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[verify-waitlist-otp] Unhandled error:", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: "internal", message: "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
