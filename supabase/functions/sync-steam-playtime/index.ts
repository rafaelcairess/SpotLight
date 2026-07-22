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

const isSteamId64 = (value: string) => /^\d{17}$/.test(value);

type SteamIdCandidate =
  | { type: "steamid"; value: string }
  | { type: "vanity"; value: string };

const parseSteamInput = (raw?: string | null): SteamIdCandidate | null => {
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
  } catch {
    // Not a URL.
  }

  if (isSteamId64(trimmed)) return { type: "steamid", value: trimmed };
  return { type: "vanity", value: trimmed };
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

const resolveVanityUrl = async (key: string, vanity: string) => {
  const url =
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}` +
    `&vanityurl=${encodeURIComponent(vanity)}`;
  const data = await fetchJson(url);
  if (data?.response?.success !== 1) return null;
  const steamId = data?.response?.steamid;
  return typeof steamId === "string" && steamId.length > 0 ? steamId : null;
};

const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

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
  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }
  if (!STEAM_API_KEY) {
    return json(500, { error: "steam_not_configured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return json(401, { error: "unauthorized", detail: "missing_token" });
  }

  // Cliente admin para operações de banco
  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── Modo batch (GitHub Actions) ─────────────────────────────────
  let rawPayload: Record<string, unknown> = {};
  try {
    rawPayload = await req.json();
  } catch { /* body vazio */ }

  if (rawPayload.batch === true && token === SUPABASE_SERVICE_ROLE_KEY) {
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, steam_id")
      .not("steam_id", "is", null);

    let synced = 0;
    for (const p of profiles || []) {
      if (!p.steam_id) continue;
      try {
        const minutesToHoursLocal = (m: number) => Math.round((m / 60) * 100) / 100;
        const ownedUrl =
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}` +
          `&steamid=${p.steam_id}&include_played_free_games=1&include_appinfo=0`;
        const res = await fetch(ownedUrl);
        if (!res.ok) continue;
        const data = await res.json();
        const games: Array<{ appid: number; playtime_forever?: number; playtime_2weeks?: number; rtime_last_played?: number }> =
          Array.isArray(data?.response?.games) ? data.response.games : [];

        const { data: userGames } = await adminSupabase
          .from("user_games")
          .select("id, app_id")
          .eq("user_id", p.user_id)
          .eq("source", "steam");

        const byAppId = new Map<number, string>();
        for (const row of userGames || []) byAppId.set(row.app_id, row.id);

        const now = new Date().toISOString();
        const updates = games
          .map((game) => {
            const id = byAppId.get(game.appid);
            if (!id) return null;
            const hours = minutesToHoursLocal(game.playtime_forever || 0);
            return {
              id,
              hours_played: hours,
              playtime_2weeks: minutesToHoursLocal(game.playtime_2weeks || 0),
              last_played_at: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
              updated_at: now,
            };
          })
          .filter(Boolean) as Array<{ id: string; hours_played: number; playtime_2weeks: number; last_played_at: string | null; updated_at: string }>;

        if (updates.length) {
          await adminSupabase.from("user_games").upsert(updates, { onConflict: "id" });
        }
        await adminSupabase.from("profiles").update({ steam_last_synced: now }).eq("user_id", p.user_id);
        synced++;
      } catch { /* continua para próximo usuário */ }
    }
    return json(200, { batch: true, synced_users: synced });
  }
  // ───────────────────────────────────────────────────────────────

  // Valida o JWT do usuário com cliente anon + JWT do usuário
  const anonKey = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const userSupabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userSupabase.auth.getUser();
  if (authError || !user) {
    console.error("auth_error:", authError?.message);
    return json(401, { error: "unauthorized", detail: authError?.message });
  }

  const payload: { steam_id?: string; import_all?: boolean; sync_platinums?: boolean; platinum_offset?: number } = rawPayload as { steam_id?: string; import_all?: boolean; sync_platinums?: boolean; platinum_offset?: number };

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("steam_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return json(500, { error: "profile_fetch_failed" });
  }

  const candidate = parseSteamInput(payload.steam_id || profile?.steam_id);
  if (!candidate) {
    return json(400, { error: "missing_steam_id" });
  }

  const importAll = payload.import_all === true;

  const steamId =
    candidate.type === "steamid"
      ? candidate.value
      : await resolveVanityUrl(STEAM_API_KEY, candidate.value);

  if (!steamId || !isSteamId64(steamId)) {
    return json(404, { error: "steam_id_not_found" });
  }

  if (profile?.steam_id !== steamId) {
    await adminSupabase
      .from("profiles")
      .update({ steam_id: steamId })
      .eq("user_id", user.id);
  }

  const includeAppInfo = importAll ? 1 : 0;
  const ownedUrl =
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}` +
    `&steamid=${steamId}&include_played_free_games=1&include_appinfo=${includeAppInfo}`;

  const twelveMonthsAgoUnix = Math.floor(Date.now() / 1000) - 365 * 24 * 3600;
  const getSmartStatus = (hours: number, rtime?: number): "wishlist" | "playing" | "dropped" => {
    const rt = rtime ?? 0;
    if (rt === 0) return hours > 0 ? "playing" : "wishlist";
    return rt < twelveMonthsAgoUnix ? "dropped" : "playing";
  };

  let games: Array<{ appid: number; playtime_forever?: number; playtime_2weeks?: number; name?: string; rtime_last_played?: number }> = [];
  try {
    const data = await fetchJson(ownedUrl);
    games = Array.isArray(data?.response?.games) ? data.response.games : [];
  } catch (error) {
    return json(502, { error: "steam_fetch_failed", detail: `${(error as Error)?.message ?? error}` });
  }

  const { data: userGames, error: userGamesError } = await adminSupabase
    .from("user_games")
    .select("id, app_id")
    .eq("user_id", user.id);

  if (userGamesError) {
    return json(500, { error: "user_games_fetch_failed" });
  }

  const byAppId = new Map<number, string>();
  for (const row of userGames || []) {
    byAppId.set(row.app_id, row.id);
  }

  const now = new Date().toISOString();
  const inserts: Array<{
    user_id: string;
    app_id: number;
    status: "wishlist" | "playing" | "dropped";
    hours_played: number;
    playtime_2weeks: number;
    last_played_at: string | null;
    added_at: string;
    updated_at: string;
  }> = [];
  const insertedAppIds: number[] = [];
  const catalogRows: Array<{
    app_id: number;
    title: string;
    image: string | null;
    steam_url: string | null;
    last_synced: string;
  }> = [];
  let detailAppIds: number[] = [];

  const updates = games
    .map((game) => {
      const id = byAppId.get(game.appid);
      const minutes = Number.isFinite(game.playtime_forever) ? game.playtime_forever || 0 : 0;
      const hours = minutesToHours(minutes);

      if (id) {
        return {
          id,
          hours_played: hours,
          playtime_2weeks: minutesToHours(game.playtime_2weeks || 0),
          last_played_at: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
          updated_at: now,
        };
      }

      if (importAll) {
        const status = getSmartStatus(hours, game.rtime_last_played);
        inserts.push({
          user_id: user.id,
          app_id: game.appid,
          status,
          hours_played: hours,
          playtime_2weeks: minutesToHours(game.playtime_2weeks || 0),
          last_played_at: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
          added_at: now,
          updated_at: now,
        });
        insertedAppIds.push(game.appid);

        const title =
          typeof game.name === "string" && game.name.trim().length > 0
            ? game.name.trim()
            : `App ${game.appid}`;

        catalogRows.push({
          app_id: game.appid,
          title,
          image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
          steam_url: `https://store.steampowered.com/app/${game.appid}`,
          last_synced: now,
        });
      }

      return null;
    })
    .filter((row): row is { id: string; hours_played: number; playtime_2weeks: number; last_played_at: string | null; updated_at: string } => !!row);

  if (updates.length) {
    const { error: updateError } = await adminSupabase
      .from("user_games")
      .upsert(updates, { onConflict: "id" });
    if (updateError) return json(500, { error: "user_games_update_failed" });
  }

  if (inserts.length) {
    const { error: insertError } = await adminSupabase.from("user_games").insert(inserts);
    if (insertError) return json(500, { error: "user_games_insert_failed", detail: insertError.message });
  }

  if (catalogRows.length) {
    const { error: catalogError } = await adminSupabase
      .from("games")
      .upsert(catalogRows, { onConflict: "app_id" });
    if (catalogError) return json(500, { error: "games_upsert_failed" });
  }

  if (importAll && games.length) {
    const appIds = games.map((g) => g.appid);
    const { data: detailRows } = await adminSupabase
      .from("games")
      .select("app_id, short_description")
      .in("app_id", appIds);

    const detailMap = new Map<number, string | null>(
      (detailRows || []).map((row) => [row.app_id, row.short_description || null])
    );
    detailAppIds = appIds.filter((appId) => {
      const desc = detailMap.get(appId);
      return !desc || desc.length === 0;
    });

  }

  let platinumSynced = 0;
  let platinumNextOffset: number | null = null;
  let platinumCandidates = 0;
  if (payload.sync_platinums === true && STEAM_API_KEY && steamId) {
    const allCandidates = games
      .filter((game) => (game.playtime_forever || 0) > 0)
      .slice(0, 150);
    const offset = Math.max(0, Number(payload.platinum_offset) || 0);
    const candidates = allCandidates.slice(offset, offset + 5);
    platinumCandidates = allCandidates.length;
    const platinumAppIds: number[] = [];

    for (let index = 0; index < candidates.length; index += 6) {
      const batch = candidates.slice(index, index + 6);
      const results = await Promise.all(batch.map(async (game) => {
        try {
          const achieveUrl =
            `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}` +
            `&steamid=${steamId}&appid=${game.appid}&l=english`;
          const achieveData = await fetchJson(achieveUrl);
          const achievements: Array<{ achieved: number }> = achieveData?.playerstats?.achievements ?? [];
          return achievements.length > 0 && achievements.every((achievement) => achievement.achieved === 1)
            ? game.appid
            : null;
        } catch {
          return null;
        }
      }));
      platinumAppIds.push(...results.filter((appId): appId is number => appId !== null));
    }

    if (platinumAppIds.length) {
      const { error: platinumError } = await adminSupabase
        .from("user_games")
        .update({ is_platinumed: true })
        .eq("user_id", user.id)
        .in("app_id", platinumAppIds);
      if (platinumError) return json(500, { error: "platinum_sync_failed" });
    }
    platinumSynced = platinumAppIds.length;
    const processed = offset + candidates.length;
    platinumNextOffset = processed < allCandidates.length ? processed : null;
  }

  await adminSupabase
    .from("profiles")
    .update({ steam_last_synced: now })
    .eq("user_id", user.id);

  return json(200, {
    updated: updates.length,
    inserted: inserts.length,
    steam_total: games.length,
    synced_at: now,
    inserted_app_ids: insertedAppIds,
    detail_app_ids: detailAppIds,
    platinum_synced: platinumSynced,
    platinum_next_offset: platinumNextOffset,
    platinum_candidates: platinumCandidates,
  });
});
