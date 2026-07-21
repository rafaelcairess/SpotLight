import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_SITE_URL") || "https://spot-light-xi.vercel.app",
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

  // app_metadata is controlled by the server; profile fields are user data and
  // must never be treated as authorization claims.
  if (targetUserId !== user.id) {
    if (user.app_metadata?.role !== "admin") {
      return json(403, { error: "forbidden", detail: "admin only" });
    }
  }

  try {
    const ensureSuccess = (label: string, error: { message?: string } | null) => {
      if (error) throw new Error(`${label}: ${error.message || "database_error"}`);
    };

    // O avatar fica fora do banco e precisa ser removido explicitamente.
    const { data: avatarFiles, error: avatarListError } = await adminSupabase.storage
      .from("avatars")
      .list(targetUserId, { limit: 100 });
    ensureSuccess("avatar_list", avatarListError);
    if (avatarFiles?.length) {
      const { error } = await adminSupabase.storage
        .from("avatars")
        .remove(avatarFiles.map((file) => `${targetUserId}/${file.name}`));
      ensureSuccess("avatar_remove", error);
    }

    // Remove também reações de terceiros nas avaliações pertencentes à conta.
    const { data: userReviews, error: reviewLookupError } = await adminSupabase
      .from("reviews")
      .select("id")
      .eq("user_id", targetUserId);
    ensureSuccess("reviews_lookup", reviewLookupError);

    if (userReviews?.length) {
      const { error } = await adminSupabase
        .from("review_reactions")
        .delete()
        .in("review_id", userReviews.map((review) => review.id));
      ensureSuccess("review_reactions_received", error);
    }

    const directDeletes = [
      ["price_alerts", adminSupabase.from("price_alerts").delete().eq("user_id", targetUserId)],
      ["notifications", adminSupabase.from("notifications").delete().eq("user_id", targetUserId)],
      ["review_reactions", adminSupabase.from("review_reactions").delete().eq("user_id", targetUserId)],
      ["follows", adminSupabase.from("follows").delete().or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`)],
      ["friend_requests", adminSupabase.from("friend_requests").delete().or(`requester_id.eq.${targetUserId},requestee_id.eq.${targetUserId}`)],
      ["reviews", adminSupabase.from("reviews").delete().eq("user_id", targetUserId)],
      ["user_top_games", adminSupabase.from("user_top_games").delete().eq("user_id", targetUserId)],
    ] as const;

    for (const [label, operation] of directDeletes) {
      const { error } = await operation;
      ensureSuccess(label, error);
    }

    // Delete list games before lists.
    const { data: userLists, error: listLookupError } = await adminSupabase
      .from("user_lists")
      .select("id")
      .eq("user_id", targetUserId);
    ensureSuccess("user_lists_lookup", listLookupError);

    if (userLists?.length) {
      const { error } = await adminSupabase
        .from("user_list_games")
        .delete()
        .in("list_id", userLists.map((list) => list.id));
      ensureSuccess("user_list_games", error);
    }

    for (const [label, operation] of [
      ["user_lists", adminSupabase.from("user_lists").delete().eq("user_id", targetUserId)],
      ["user_games", adminSupabase.from("user_games").delete().eq("user_id", targetUserId)],
      ["profiles", adminSupabase.from("profiles").delete().eq("user_id", targetUserId)],
    ] as const) {
      const { error } = await operation;
      ensureSuccess(label, error);
    }

  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("account_cleanup_failed:", detail);
    return json(500, { error: "account_cleanup_failed", detail });
  }

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
    console.error("auth_delete_failed status:", deleteRes.status);
    return json(500, { error: "auth_delete_failed" });
  }

  return json(200, { success: true, deleted_user_id: targetUserId });
});
