import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!serviceKey || token !== serviceKey) {
    return json(401, { error: "unauthorized" });
  }

  let payload: { to?: string; subject?: string; html?: string };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const html = payload.html?.trim();

  if (!to || !subject || !html) {
    return json(400, { error: "missing_fields" });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const emailFrom = Deno.env.get("EMAIL_FROM") || "";
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") || "";

  if (!resendKey || !emailFrom) {
    return json(501, { error: "email_not_configured" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return json(500, { error: "email_failed", details: errorBody });
  }

  return json(200, { ok: true });
});
