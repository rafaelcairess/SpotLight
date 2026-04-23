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

const isSteamId64 = (value: string) => /^\d{17}$/.test(value);

const parseSteamInput = (raw?: string | null): { type: "steamid" | "vanity"; value: string } | null => {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith("steamcommunity.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const type = parts[0];
      const value = parts[1];
      if (type === "profiles" && value) return { type: "steamid", value };
      if (type === "id" && value) return { type: "vanity", value };
    }
  } catch { /* not a URL */ }

  if (isSteamId64(trimmed)) return { type: "steamid", value: trimmed };
  return { type: "vanity", value: trimmed };
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const resolveVanityUrl = async (key: string, vanity: string): Promise<string | null> => {
  const data = await fetchJson(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanity)}`
  );
  if (data?.response?.success !== 1) return null;
  const steamId = data?.response?.steamid;
  return typeof steamId === "string" && steamId.length > 0 ? steamId : null;
};

const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

interface AchievementResult { total: number; unlocked: number }

const fetchAchievements = async (key: string, steamId: string, appId: number): Promise<AchievementResult | null> => {
  try {
    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${steamId}&appid=${appId}&l=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.playerstats?.success) return null;
    const achievements: Array<{ achieved: number }> = data.playerstats.achievements || [];
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.achieved === 1).length;
    return total > 0 ? { total, unlocked } : null;
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json(500, { error: "server_not_configured" });
  if (!STEAM_API_KEY) return json(500, { error: "steam_not_configured" });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json(401, { error: "unauthorized" });

  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const anonKey = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const userSupabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userSupabase.auth.getUser();
  if (authError || !user) return json(401, { error: "unauthorized", detail: authError?.message });

  let payload: { profile_url?: string } = {};
  try { payload = await req.json(); } catch { /* empty body */ }

  const candidate = parseSteamInput(payload.profile_url);
  if (!candidate) return json(400, { error: "missing_profile_url", detail: "Forneça um URL de perfil Steam válido" });

  let steamId: string | null = null;
  try {
    steamId = candidate.type === "steamid"
      ? candidate.value
      : await resolveVanityUrl(STEAM_API_KEY, candidate.value);
  } catch (e) {
    return json(502, { error: "steam_resolve_failed", detail: `${(e as Error)?.message}` });
  }

  if (!steamId || !isSteamId64(steamId)) {
    return json(404, { error: "steam_profile_not_found", detail: "Perfil Steam não encontrado. Verifique se o URL está correto." });
  }

  // Fetch owned games
  let games: Array<{ appid: number; playtime_forever?: number; name?: string }> = [];
  try {
    const data = await fetchJson(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_played_free_games=1&include_appinfo=1`
    );
    games = Array.isArray(data?.response?.games) ? data.response.games : [];
  } catch (e) {
    return json(502, { error: "steam_fetch_failed", detail: `${(e as Error)?.message}` });
  }

  if (games.length === 0) {
    return json(200, {
      warning: "library_empty_or_private",
      detail: "Nenhum jogo encontrado. Verifique se sua biblioteca Steam está pública.",
      imported: 0,
      steam_id: steamId,
    });
  }

  // Upsert profile steam_id
  await adminSupabase.from("profiles").update({ steam_id: steamId }).eq("user_id", user.id);

  // Fetch existing user_games for Steam
  const { data: existingGames } = await adminSupabase
    .from("user_games")
    .select("id, app_id")
    .eq("user_id", user.id)
    .eq("source", "steam");

  const byAppId = new Map<number, string>();
  for (const row of existingGames || []) byAppId.set(row.app_id, row.id);

  const now = new Date().toISOString();
  const inserts: Array<Record<string, unknown>> = [];
  const catalogRows: Array<Record<string, unknown>> = [];

  for (const game of games) {
    const hours = minutesToHours(game.playtime_forever || 0);
    const title = typeof game.name === "string" && game.name.trim() ? game.name.trim() : `App ${game.appid}`;

    catalogRows.push({
      app_id: game.appid,
      title,
      image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
      steam_url: `https://store.steampowered.com/app/${game.appid}`,
      last_synced: now,
    });

    if (!byAppId.has(game.appid)) {
      inserts.push({
        user_id: user.id,
        app_id: game.appid,
        status: hours > 0 ? "playing" : "wishlist",
        hours_played: hours,
        source: "steam",
        added_at: now,
        updated_at: now,
      });
    } else {
      await adminSupabase.from("user_games")
        .update({ hours_played: hours, updated_at: now })
        .eq("id", byAppId.get(game.appid)!);
    }
  }

  if (catalogRows.length) {
    await adminSupabase.from("games").upsert(catalogRows, { onConflict: "app_id" });
  }
  if (inserts.length) {
    await adminSupabase.from("user_games").insert(inserts);
  }

  // Fetch updated user_games list for achievement sync
  const { data: allUserGames } = await adminSupabase
    .from("user_games")
    .select("id, app_id")
    .eq("user_id", user.id)
    .eq("source", "steam");

  const appIdToRowId = new Map<number, string>();
  for (const row of allUserGames || []) appIdToRowId.set(row.app_id, row.id);

  // Fetch achievements in parallel batches of 8
  const allAppIds = games.map((g) => g.appid);
  const BATCH = 8;
  let platinumed = 0;

  for (let i = 0; i < allAppIds.length; i += BATCH) {
    const batch = allAppIds.slice(i, i + BATCH);
    await Promise.all(batch.map(async (appId) => {
      const rowId = appIdToRowId.get(appId);
      if (!rowId) return;
      const achData = await fetchAchievements(STEAM_API_KEY, steamId!, appId);
      if (!achData) return;
      const isPlatinumed = achData.unlocked >= achData.total;
      if (isPlatinumed) platinumed++;
      await adminSupabase.from("user_games").update({
        achievement_unlocked: achData.unlocked,
        achievement_total: achData.total,
        is_platinumed: isPlatinumed,
        updated_at: now,
      }).eq("id", rowId);
    }));
  }

  await adminSupabase.from("profiles")
    .update({ steam_last_synced: now })
    .eq("user_id", user.id);

  return json(200, {
    steam_id: steamId,
    imported: inserts.length,
    updated: games.length - inserts.length,
    steam_total: games.length,
    platinumed,
    synced_at: now,
  });
});
