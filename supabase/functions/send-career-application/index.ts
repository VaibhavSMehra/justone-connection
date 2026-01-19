import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResumeData {
  filename: string;
  content: string; // base64 encoded
  type: string;
}

interface ApplicationRequest {
  fullName: string;
  university: string;
  year: string;
  major: string;
  email: string;
  whyJustOne: string;
  resume?: ResumeData | null;
}

interface MailerooAttachment {
  filename: string;
  content: string;
  type: string;
}

// Maileroo API helper
async function sendEmailWithMaileroo(
  apiKey: string,
  from: { address: string; displayName: string },
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
  attachments?: MailerooAttachment[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = {
      from: {
        address: from.address,
        display_name: from.displayName,
      },
      to: {
        address: to,
      },
      subject: subject,
      html: html,
    };

    if (replyTo) {
      body.reply_to = { address: replyTo };
    }

    if (attachments && attachments.length > 0) {
      body.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        type: att.type,
      }));
    }

    const response = await fetch("https://smtp.maileroo.com/api/v2/emails", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("[send-career-application] Maileroo response:", JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-career-application] Maileroo error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mailerooApiKey = Deno.env.get("MAILEROO_API_KEY");

    if (!mailerooApiKey) {
      console.error("MAILEROO_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const application: ApplicationRequest = await req.json();
    const { fullName, university, year, major, email, whyJustOne, resume } = application;

    // Validate required fields
    if (!fullName || !university || !year || !major || !email || !whyJustOne) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const hasResume = resume && resume.filename && resume.content;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #FAF4E8; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 48px; border-radius: 4px; }
          .section { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .section-title { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
          .field { margin: 8px 0; color: #333; }
          .field strong { color: #1a1a1a; }
          .footer { color: #999; font-size: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #1a1a1a; font-weight: normal; font-size: 24px; margin-bottom: 24px;">New Marketing Intern Application</h1>
          
          <div class="section">
            <h2 class="section-title">Applicant Details</h2>
            <p class="field"><strong>Name:</strong> ${fullName}</p>
            <p class="field"><strong>Email:</strong> ${email}</p>
            <p class="field"><strong>University:</strong> ${university}</p>
            <p class="field"><strong>Year:</strong> ${year}</p>
            <p class="field"><strong>Major:</strong> ${major}</p>
            ${hasResume ? `<p class="field"><strong>Resume:</strong> ${resume.filename} (attached)</p>` : ''}
          </div>
          
          <div class="section">
            <h2 class="section-title">Why JustOne?</h2>
            <p style="margin: 0; color: #333; white-space: pre-wrap;">${whyJustOne}</p>
          </div>
          
          <div class="footer">
            <p>This application was submitted through the JustOne careers page.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments if resume exists
    const attachments: MailerooAttachment[] = [];
    if (hasResume) {
      attachments.push({
        filename: resume.filename,
        content: resume.content,
        type: resume.type,
      });
    }

    const emailResult = await sendEmailWithMaileroo(
      mailerooApiKey,
      { address: "careers@justonematch.in", displayName: "JustOne Careers" },
      "support@justonematch.in",
      `Marketing Intern Application: ${fullName} (${university})`,
      emailHtml,
      email,
      attachments.length > 0 ? attachments : undefined
    );

    if (!emailResult.success) {
      console.error("Failed to send application email:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send application" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Application email sent successfully for:", fullName, university, hasResume ? "(with resume)" : "(no resume)");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-career-application:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
