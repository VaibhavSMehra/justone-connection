import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitResponsesRequest {
  answers: Record<string, any>;
  questionnaire_version: string;
  photo?: string; // Optional base64 photo
}

// Compute SHA-256 hash of data for integrity verification
async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// AES-GCM encryption using Web Crypto API
async function encryptData(data: string, keyString: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Derive a key from the secret
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keyString),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Use a fixed salt for consistency (in production, you might want to store per-record salts)
  const salt = encoder.encode("justone-salt-v1");
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convert to base64 using chunked approach to avoid stack overflow
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < combined.length; i += chunkSize) {
    const chunk = combined.subarray(i, Math.min(i + chunkSize, combined.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");

    if (!encryptionKey) {
      console.error("ENCRYPTION_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Encryption not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get claims to verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Use service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile to verify campus
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("campus_id, verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile.verified || !profile.campus_id) {
      return new Response(
        JSON.stringify({ error: "Account not verified or missing campus" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { answers, questionnaire_version, photo }: SubmitResponsesRequest = await req.json();

    if (!answers || typeof answers !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid answers format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!questionnaire_version || typeof questionnaire_version !== "string") {
      return new Response(
        JSON.stringify({ error: "Questionnaire version is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate photo if provided (must be base64 data URL)
    let encryptedPhoto: string | null = null;
    if (photo) {
      if (typeof photo !== "string" || !photo.startsWith("data:image/")) {
        return new Response(
          JSON.stringify({ error: "Invalid photo format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      // Encrypt the photo using the same encryption method
      encryptedPhoto = await encryptData(photo, encryptionKey);
    }

    // Encrypt the answers and compute hash for integrity
    const answersJson = JSON.stringify(answers);
    const encryptedAnswers = await encryptData(answersJson, encryptionKey);
    const responsesHash = await computeHash(answersJson);

    // Check if user already has a response for this version
    const { data: existingResponse } = await supabaseService
      .from("responses")
      .select("id")
      .eq("user_id", userId)
      .eq("questionnaire_version", questionnaire_version)
      .maybeSingle();

    if (existingResponse) {
      // Update existing response
      const updateData: Record<string, any> = {
        answers_encrypted: encryptedAnswers,
        responses_hash: responsesHash,
        updated_at: new Date().toISOString(),
      };
      
      // Only update photo if provided (don't remove existing photo if not provided)
      if (encryptedPhoto !== null) {
        updateData.photo_encrypted = encryptedPhoto;
      }
      
      const { error: updateError } = await supabaseService
        .from("responses")
        .update(updateData)
        .eq("id", existingResponse.id);

      if (updateError) {
        console.error("Error updating response:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update responses" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Insert new response
      const insertData: Record<string, any> = {
        user_id: userId,
        campus_id: profile.campus_id,
        questionnaire_version: questionnaire_version,
        answers_encrypted: encryptedAnswers,
        responses_hash: responsesHash,
      };
      
      if (encryptedPhoto !== null) {
        insertData.photo_encrypted = encryptedPhoto;
      }
      
      const { error: insertError } = await supabaseService
        .from("responses")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting response:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save responses" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in submit-responses:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
