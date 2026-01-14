import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

// AES-GCM decryption using Web Crypto API
async function decryptData(encryptedBase64: string, keyString: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes) and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  // Derive the key from the secret
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keyString),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

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
    ["decrypt"]
  );

  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData
  );

  return decoder.decode(decryptedData);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    const adminApiKey = Deno.env.get("ADMIN_API_KEY");

    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: "Encryption not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!adminApiKey) {
      return new Response(
        JSON.stringify({ error: "Admin API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify admin API key
    const providedKey = req.headers.get("x-admin-key");
    if (!providedKey || providedKey !== adminApiKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid admin key" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse query params for filtering
    const url = new URL(req.url);
    const campusId = url.searchParams.get("campus_id");
    const userId = url.searchParams.get("user_id");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from("responses")
      .select(`
        id,
        user_id,
        campus_id,
        questionnaire_version,
        answers_encrypted,
        responses_hash,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (campusId) {
      query = query.eq("campus_id", campusId);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: responses, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching responses:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch responses" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Decrypt all responses
    const decryptedResponses = await Promise.all(
      (responses || []).map(async (response) => {
        try {
          const decryptedAnswers = await decryptData(response.answers_encrypted, encryptionKey);
          return {
            id: response.id,
            user_id: response.user_id,
            campus_id: response.campus_id,
            questionnaire_version: response.questionnaire_version,
            answers: JSON.parse(decryptedAnswers),
            responses_hash: response.responses_hash,
            created_at: response.created_at,
            updated_at: response.updated_at,
          };
        } catch (decryptError) {
          console.error("Failed to decrypt response:", response.id, decryptError);
          return {
            id: response.id,
            user_id: response.user_id,
            campus_id: response.campus_id,
            questionnaire_version: response.questionnaire_version,
            answers: null,
            decryption_error: true,
            responses_hash: response.responses_hash,
            created_at: response.created_at,
            updated_at: response.updated_at,
          };
        }
      })
    );

    // Get total count for pagination
    const { count } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        data: decryptedResponses,
        pagination: {
          total: count,
          limit,
          offset,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-get-responses:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
