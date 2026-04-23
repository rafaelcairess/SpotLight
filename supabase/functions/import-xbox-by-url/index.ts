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

// Extrai o gamertag de uma URL Xbox ou retorna o valor diretamente
const parseXboxInput = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("xbox.com")) {
      // ex: https://www.xbox.com/pt-BR/play/user/Gamertag
      // ex: https://account.xbox.com/pt-BR/gamertag/Gamertag
      const parts = url.pathname.split("/").filter(Boolean);
      const userIdx = parts.findIndex((p) => p === "user" || p === "gamertag");
      if (userIdx !== -1 && parts[userIdx + 1]) {
        return decodeURIComponent(parts[userIdx + 1]);
      }
      // Tenta o último segmento não-vazio como gamertag
      const last = parts[parts.length - 1];
      if (last && last.length >= 1 && last.length <= 15) return decodeURIComponent(last);
    }
  } catch { /* not a URL */ }

  // Aceita gamertag diretamente (1–15 chars, alfanumérico + espaços)
  if (/^[a-zA-Z0-9 ]{1,15}$/.test(trimmed)) return trimmed;
  return null;
};

interface OpenXblTitle {
  titleId: string;
  name: string;
  achievement?: {
    currentAchievements: number;
    totalAchievements: number;
    currentGamerscore: number;
    totalGamerscore: number;
  };
  images?: Array<{ url: string; type: string }>;
  titleHistory?: { lastTimePlayed: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const OPENXBL_API_KEY = Deno.env.get("OPENXBL_API_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json(500, { error: "server_not_configured" });
  if (!OPENXBL_API_KEY) return json(500, { error: "xbox_not_configured", detail: "OPENXBL_API_KEY não configurada" });

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

  const gamertag = parseXboxInput(payload.profile_url || "");
  if (!gamertag) {
    return json(400, {
      error: "invalid_profile_url",
      detail: "Forneça um URL de perfil Xbox (ex: https://www.xbox.com/play/user/SeuGamertag) ou apenas o gamertag.",
    });
  }

  // Busca título history via OpenXBL
  let titles: OpenXblTitle[] = [];
  try {
    const xblRes = await fetch(
      `https://xbl.io/api/v2/player/titleHistory/${encodeURIComponent(gamertag)}?maxItems=500`,
      {
        headers: {
          "X-Authorization": OPENXBL_API_KEY,
          "Accept": "application/json",
          "Accept-Language": "pt-BR",
        },
      }
    );

    if (!xblRes.ok) {
      if (xblRes.status === 404) {
        return json(404, { error: "xbox_profile_not_found", detail: `Gamertag '${gamertag}' não encontrado.` });
      }
      if (xblRes.status === 401) {
        return json(500, { error: "xbox_api_key_invalid", detail: "Chave OpenXBL inválida ou expirada." });
      }
      return json(502, { error: "xbox_api_failed", detail: `OpenXBL retornou ${xblRes.status}` });
    }

    const xblData = await xblRes.json();
    titles = Array.isArray(xblData?.titles) ? xblData.titles : [];
  } catch (e) {
    return json(502, { error: "xbox_fetch_failed", detail: `${(e as Error)?.message}` });
  }

  if (titles.length === 0) {
    await adminSupabase.from("profiles")
      .update({ xbox_gamertag: gamertag, xbox_last_synced: new Date().toISOString() })
      .eq("user_id", user.id);
    return json(200, {
      warning: "no_games_found",
      detail: "Nenhum jogo encontrado para este gamertag.",
      imported: 0,
      gamertag,
    });
  }

  // Fetch existing user_games for Xbox
  const { data: existingGames } = await adminSupabase
    .from("user_games")
    .select("id, app_id")
    .eq("user_id", user.id)
    .eq("source", "xbox");

  const byAppId = new Map<number, string>();
  for (const row of existingGames || []) byAppId.set(row.app_id, row.id);

  const now = new Date().toISOString();
  const inserts: Array<Record<string, unknown>> = [];
  const catalogRows: Array<Record<string, unknown>> = [];
  let platinumed = 0;

  for (const title of titles) {
    const titleIdNum = parseInt(title.titleId, 10);
    if (!titleIdNum) continue;

    // Namespace negativo para Xbox (evita colisão com app_id Steam positivo)
    const appId = -(titleIdNum % 2_147_483_647);

    const ach = title.achievement;
    const isPlatinumed = ach != null && ach.totalAchievements > 0 && ach.currentAchievements >= ach.totalAchievements;
    if (isPlatinumed) platinumed++;

    const coverImage =
      title.images?.find((img) => img.type === "BoxArt" || img.type === "Tile")?.url ||
      title.images?.[0]?.url ||
      null;

    catalogRows.push({
      app_id: appId,
      title: title.name,
      image: coverImage,
      last_synced: now,
    });

    if (!byAppId.has(appId)) {
      inserts.push({
        user_id: user.id,
        app_id: appId,
        status: "playing",
        source: "xbox",
        is_platinumed: isPlatinumed,
        achievement_unlocked: ach?.currentAchievements ?? 0,
        achievement_total: ach?.totalAchievements ?? 0,
        added_at: now,
        updated_at: now,
      });
    } else {
      const rowId = byAppId.get(appId)!;
      await adminSupabase.from("user_games").update({
        is_platinumed: isPlatinumed,
        achievement_unlocked: ach?.currentAchievements ?? 0,
        achievement_total: ach?.totalAchievements ?? 0,
        updated_at: now,
      }).eq("id", rowId);
    }
  }

  if (catalogRows.length) {
    await adminSupabase.from("games").upsert(catalogRows, { onConflict: "app_id" });
  }
  if (inserts.length) {
    await adminSupabase.from("user_games").insert(inserts);
  }

  await adminSupabase.from("profiles").update({
    xbox_gamertag: gamertag,
    xbox_last_synced: now,
  }).eq("user_id", user.id);

  return json(200, {
    gamertag,
    imported: inserts.length,
    updated: titles.length - inserts.length,
    xbox_total: titles.length,
    platinumed,
    synced_at: now,
  });
});
