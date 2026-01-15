import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  code: string;
  isAdminMode?: boolean;
}

// Admin email allowlist
const ADMIN_EMAILS = [
  "vaibhavmehra2027@u.northwestern.edu",
  "antonyvincent2026@u.northwestern.edu"
];

// Maximum verification attempts before OTP is invalidated
const MAX_VERIFICATION_ATTEMPTS = 5;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, code, isAdminMode }: VerifyOtpRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // SERVER-SIDE VALIDATION: Admin mode
    if (isAdminMode) {
      if (!ADMIN_EMAILS.includes(normalizedEmail)) {
        return new Response(
          JSON.stringify({
            error: "admin_only",
            message: "Admin access only."
          }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate code format
    if (!/^\d{6}$/.test(normalizedCode)) {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the most recent unused OTP for this email (regardless of code match)
    const { data: latestOtp, error: latestOtpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOtpError) {
      console.error("Error fetching OTP:", latestOtpError);
      return new Response(
        JSON.stringify({ error: "Verification failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if there's a valid OTP to verify against
    if (!latestOtp) {
      return new Response(
        JSON.stringify({ error: "No active verification code found. Please request a new code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if max attempts exceeded
    if (latestOtp.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      // Invalidate the OTP due to too many attempts
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", latestOtp.id);

      return new Response(
        JSON.stringify({ 
          error: "max_attempts_exceeded",
          message: "Too many failed attempts. Please request a new verification code." 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code matches
    if (latestOtp.code !== normalizedCode) {
      // Increment attempt counter
      const newAttempts = latestOtp.attempts + 1;
      await supabase
        .from("otp_codes")
        .update({ attempts: newAttempts })
        .eq("id", latestOtp.id);

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - newAttempts;
      
      if (remainingAttempts <= 0) {
        // Invalidate the OTP
        await supabase
          .from("otp_codes")
          .update({ used: true })
          .eq("id", latestOtp.id);

        return new Response(
          JSON.stringify({ 
            error: "max_attempts_exceeded",
            message: "Too many failed attempts. Please request a new verification code." 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: "invalid_code",
          message: `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code matches - mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", latestOtp.id);

    // Get campus for the email domain
    const domain = normalizedEmail.split("@")[1];
    let matchingCampus: { id: string; name: string; allowed_domains: string[] } | null = null;

    if (isAdminMode) {
      // For admins, use Northwestern campus
      const { data: campuses } = await supabase
        .from("campuses")
        .select("id, name, allowed_domains")
        .eq("name", "Northwestern University")
        .limit(1)
        .maybeSingle();
      matchingCampus = campuses;
    } else {
      const { data: campuses } = await supabase
        .from("campuses")
        .select("id, name, allowed_domains");

      matchingCampus = campuses?.find((campus: { id: string; name: string; allowed_domains: string[] }) =>
        campus.allowed_domains.includes(domain)
      ) || null;

      if (!matchingCampus) {
        return new Response(
          JSON.stringify({ error: "Please use your institutional email from Ashoka / Jindal / CHRIST." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check if user exists, if not create with a random password
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with email confirmed
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: randomPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = newUser.user.id;
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        email: normalizedEmail,
        campus_id: matchingCampus?.id || null,
        verified: true,
      }, {
        onConflict: "user_id",
      });

    if (profileError) {
      console.error("Error upserting profile:", profileError);
    }

    // Determine role and upsert user_roles
    const role = ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "student";
    
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role,
      }, {
        onConflict: "user_id,role",
      });

    if (roleError) {
      console.error("Error upserting user role:", roleError);
    }

    // Generate a magic link and extract the token_hash
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkError || !linkData) {
      console.error("Error generating magic link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate session" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // The hashed_token from generateLink can be used with verifyOtp to get session tokens
    const hashedToken = linkData.properties?.hashed_token;
    if (!hashedToken) {
      console.error("No hashed_token in link data:", linkData);
      return new Response(
        JSON.stringify({ error: "Failed to generate authentication token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use verifyOtp to exchange the hashed token for session tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (sessionError || !sessionData.session) {
      console.error("Error verifying magic link token:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User verified successfully:", normalizedEmail, "role:", role);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        campus_id: matchingCampus?.id,
        campus_name: matchingCampus?.name,
        role: role,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in verify-otp:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
