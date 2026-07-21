import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json(401, { error: "unauthorized" });

  const anonKey = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const userSupabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userSupabase.auth.getUser();
  if (authError || !user) {
    return json(401, { error: "unauthorized", detail: authError?.message });
  }

  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let rawBody: Record<string, unknown> = {};
  try { rawBody = await req.json(); } catch { /* empty body = self-delete */ }

  const targetUserId = typeof rawBody.target_user_id === "string"
    ? rawBody.target_user_id
    : user.id;

  // If deleting someone else, verify caller is admin
  if (targetUserId !== user.id) {
    const { data: callerProfile } = await adminSupabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      return json(403, { error: "forbidden", detail: "admin only" });
    }
  }

  // Delete all user-owned data in safe order
  await adminSupabase.from("price_alerts").delete().eq("user_id", targetUserId);
  await adminSupabase.from("notifications").delete().eq("user_id", targetUserId);
  await adminSupabase.from("review_reactions").delete().eq("user_id", targetUserId);
  await adminSupabase.from("follows").delete().or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`);
  await adminSupabase.from("friend_requests").delete().or(`requester_id.eq.${targetUserId},requestee_id.eq.${targetUserId}`);
  await adminSupabase.from("reviews").delete().eq("user_id", targetUserId);
  await adminSupabase.from("user_top_games").delete().eq("user_id", targetUserId);

  // Delete list games before lists
  const { data: userLists } = await adminSupabase
    .from("user_lists")
    .select("id")
    .eq("user_id", targetUserId);
  if (userLists && userLists.length > 0) {
    const listIds = userLists.map((l) => l.id);
    await adminSupabase.from("user_list_games").delete().in("list_id", listIds);
  }
  await adminSupabase.from("user_lists").delete().eq("user_id", targetUserId);
  await adminSupabase.from("user_games").delete().eq("user_id", targetUserId);
  await adminSupabase.from("profiles").delete().eq("user_id", targetUserId);

  // Delete the auth user
  const deleteRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${targetUserId}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!deleteRes.ok) {
    const errText = await deleteRes.text();
    console.error("auth_delete_failed:", deleteRes.status, errText);
    return json(500, { error: "auth_delete_failed", detail: errText });
  }

  return json(200, { success: true, deleted_user_id: targetUserId });
});
