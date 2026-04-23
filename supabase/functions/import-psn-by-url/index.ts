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

// Extrai o username da URL do PSNProfiles ou retorna o valor como username diretamente
const parsePsnProfilesUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("psnprofiles.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      // /username ou /trophies/username
      if (parts[0] === "trophies" && parts[1]) return parts[1];
      if (parts[0]) return parts[0];
    }
  } catch { /* not a URL */ }

  // Assume que é o próprio username PSN
  if (/^[a-zA-Z0-9_-]{3,16}$/.test(trimmed)) return trimmed;
  return null;
};

// Hash numérico para converter npCommunicationId (string PSN) em app_id integer
const hashId = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return -Math.abs(h % 1_073_741_823) - 1;
};

interface PsnGame {
  title: string;
  image: string | null;
  completionPct: number;
  isPlatinumed: boolean;
  trophiesEarned: number;
  trophiesTotal: number;
  npCommunicationId: string | null;
}

// Faz scraping da página de jogos do PSNProfiles
const scrapePsnProfilesGames = async (username: string): Promise<PsnGame[]> => {
  const url = `https://psnprofiles.com/${encodeURIComponent(username)}/games`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("profile_not_found");
    if (res.status === 403) throw new Error("profile_private_or_blocked");
    throw new Error(`psn_fetch_failed:${res.status}`);
  }

  const html = await res.text();

  // Verifica se o perfil é privado ou não encontrado
  if (html.includes("This profile has been set to private") || html.includes("não encontrado")) {
    throw new Error("profile_private");
  }

  const games: PsnGame[] = [];

  // Faz parsing da tabela de jogos
  // PSNProfiles usa rows <tr> com classe para jogos platinados
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];

    // Extrai o link para os trofeus do jogo (contém npCommunicationId)
    const trophyLinkMatch = row.match(/href="\/trophies\/([\w-]+)\//);
    const npComId = trophyLinkMatch ? trophyLinkMatch[1] : null;

    // Extrai título do jogo
    const titleMatch = row.match(/<span[^>]*class="[^"]*game-name[^"]*"[^>]*>([\s\S]*?)<\/span>/) ||
                       row.match(/title="([^"]+)"\s+href="\/trophies\//);
    if (!titleMatch) continue;
    const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!title) continue;

    // Extrai imagem do jogo
    const imgMatch = row.match(/<img[^>]+src="([^"]+)"[^>]*>/);
    const image = imgMatch ? imgMatch[1] : null;

    // Extrai % de conclusão
    const pctMatch = row.match(/(\d+(?:\.\d+)?)\s*%/) ||
                     row.match(/data-percent="(\d+(?:\.\d+)?)"/);
    const completionPct = pctMatch ? parseFloat(pctMatch[1]) : 0;

    // Verifica se tem platina (ícone de platina com valor > 0)
    const platinumMatch = row.match(/<td[^>]*class="[^"]*platinum[^"]*"[^>]*>\s*<[^>]+>\s*(\d+)/);
    const platinumCount = platinumMatch ? parseInt(platinumMatch[1]) : 0;
    const isPlatinumed = platinumCount > 0;

    // Extrai total de trofeus
    const trophiesMatch = row.match(/(\d+)\s*\/\s*(\d+)\s*trophies/i) ||
                          row.match(/trophies-count[^>]*>(\d+)/);
    const trophiesEarned = trophiesMatch ? parseInt(trophiesMatch[1]) : 0;
    const trophiesTotal = trophiesMatch && trophiesMatch[2] ? parseInt(trophiesMatch[2]) : 0;

    if (npComId || title) {
      games.push({
        title,
        image,
        completionPct,
        isPlatinumed,
        trophiesEarned,
        trophiesTotal,
        npCommunicationId: npComId,
      });
    }
  }

  // Fallback: tenta parsing alternativo se não encontrou jogos
  if (games.length === 0) {
    // Tenta extrair dados de uma estrutura alternativa
    const altRowRegex = /<a[^>]+href="\/trophies\/([^/"]+)[^"]*"[^>]*>[\s\S]*?<\/a>/g;
    let altMatch: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((altMatch = altRowRegex.exec(html)) !== null) {
      const npComId = altMatch[1];
      if (seen.has(npComId)) continue;
      seen.add(npComId);

      const block = altMatch[0];
      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);
      const titleFromAlt = block.match(/>([^<]{3,50})<\/a>/);

      games.push({
        title: titleFromAlt ? titleFromAlt[1].trim() : npComId,
        image: imgMatch ? imgMatch[1] : null,
        completionPct: 0,
        isPlatinumed: false,
        trophiesEarned: 0,
        trophiesTotal: 0,
        npCommunicationId: npComId,
      });
    }
  }

  return games;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json(500, { error: "server_not_configured" });

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

  const username = parsePsnProfilesUrl(payload.profile_url || "");
  if (!username) {
    return json(400, {
      error: "invalid_profile_url",
      detail: "Forneça um URL do PSNProfiles (ex: https://psnprofiles.com/seu-username) ou seu PSN ID.",
    });
  }

  let games: PsnGame[] = [];
  try {
    games = await scrapePsnProfilesGames(username);
  } catch (e) {
    const msg = (e as Error)?.message || "";
    if (msg === "profile_not_found") {
      return json(404, { error: "profile_not_found", detail: `Perfil '${username}' não encontrado no PSNProfiles.` });
    }
    if (msg === "profile_private" || msg === "profile_private_or_blocked") {
      return json(403, { error: "profile_private", detail: "Perfil privado ou bloqueado. Garanta que seu perfil PSNProfiles está público." });
    }
    return json(502, { error: "psn_fetch_failed", detail: msg });
  }

  if (games.length === 0) {
    // Salva o psn_online_id mesmo sem jogos (confirma que o perfil existe)
    await adminSupabase.from("profiles")
      .update({ psn_online_id: username, psn_last_synced: new Date().toISOString() })
      .eq("user_id", user.id);
    return json(200, {
      warning: "no_games_found",
      detail: "Nenhum jogo encontrado no perfil. Certifique-se que você tem jogos com trofeus no PSNProfiles.",
      imported: 0,
      psn_username: username,
    });
  }

  // Fetch existing user_games for PSN
  const { data: existingGames } = await adminSupabase
    .from("user_games")
    .select("id, app_id")
    .eq("user_id", user.id)
    .eq("source", "psn");

  const byAppId = new Map<number, string>();
  for (const row of existingGames || []) byAppId.set(row.app_id, row.id);

  const now = new Date().toISOString();
  const inserts: Array<Record<string, unknown>> = [];
  const catalogRows: Array<Record<string, unknown>> = [];
  let platinumed = 0;

  for (const game of games) {
    const appId = game.npCommunicationId ? hashId(game.npCommunicationId) : hashId(game.title);
    if (game.isPlatinumed) platinumed++;

    catalogRows.push({
      app_id: appId,
      title: game.title,
      image: game.image,
      last_synced: now,
    });

    if (!byAppId.has(appId)) {
      inserts.push({
        user_id: user.id,
        app_id: appId,
        status: game.completionPct > 0 ? "playing" : "wishlist",
        source: "psn",
        is_platinumed: game.isPlatinumed,
        achievement_unlocked: game.trophiesEarned,
        achievement_total: game.trophiesTotal,
        added_at: now,
        updated_at: now,
      });
    } else {
      const rowId = byAppId.get(appId)!;
      await adminSupabase.from("user_games").update({
        is_platinumed: game.isPlatinumed,
        achievement_unlocked: game.trophiesEarned,
        achievement_total: game.trophiesTotal,
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
    psn_online_id: username,
    psn_last_synced: now,
  }).eq("user_id", user.id);

  return json(200, {
    psn_username: username,
    imported: inserts.length,
    updated: games.length - inserts.length,
    psn_total: games.length,
    platinumed,
    synced_at: now,
  });
});
