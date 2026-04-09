import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const buildRedirect = (value: string | null, baseOrigin: string) => {
  if (!value) return baseOrigin;
  try {
    const resolved = new URL(value, baseOrigin);
    if (resolved.origin !== baseOrigin) return baseOrigin;
    return resolved.toString();
  } catch {
    return baseOrigin;
  }
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

/** Extrai o valor de um cookie pelo nome */
const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === name) return v ?? null;
  }
  return null;
};

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }

  const url = new URL(req.url);
  const fallbackSite = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || url.origin;

  let baseOrigin = url.origin;
  try {
    baseOrigin = new URL(fallbackSite).origin;
  } catch {
    baseOrigin = url.origin;
  }

  const safeRedirect = buildRedirect(url.searchParams.get("redirect"), baseOrigin);

  // ── Validação CSRF via nonce ──────────────────────────────────────
  const nonceFromUrl = url.searchParams.get("nonce");
  const nonceFromCookie = getCookie(req.headers.get("cookie"), "steam_nonce");

  if (!nonceFromUrl || !nonceFromCookie || nonceFromUrl !== nonceFromCookie) {
    return json(403, { error: "csrf_nonce_mismatch" });
  }
  // ─────────────────────────────────────────────────────────────────

  const openIdParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith("openid.")) openIdParams.set(key, value);
  }

  if (!openIdParams.get("openid.claimed_id")) {
    return json(400, { error: "missing_openid_claim" });
  }

  openIdParams.set("openid.mode", "check_authentication");

  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: openIdParams.toString(),
  });

  if (!verifyRes.ok) {
    return json(502, { error: "steam_verify_failed" });
  }

  const verifyText = await verifyRes.text();
  if (!verifyText.includes("is_valid:true")) {
    return json(401, { error: "steam_invalid" });
  }

  const claimedId = openIdParams.get("openid.claimed_id") || "";
  const match = claimedId.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})/);
  const steamId = match?.[1];

  if (!steamId) {
    return json(400, { error: "steam_id_missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = `steam_${steamId}@steam.local`;

  let userId: string | undefined;

  const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
  if (existingUser?.user?.id) {
    userId = existingUser.user.id;
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { steam_id: steamId, provider: "steam" },
    });
  } else {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { steam_id: steamId, provider: "steam" },
    });

    if (createError || !createdUser?.user?.id) {
      return json(500, { error: "user_create_failed" });
    }

    userId = createdUser.user.id;
  }

  if (!userId) {
    return json(500, { error: "user_missing" });
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingProfile?.id) {
    await supabase.from("profiles").update({ steam_id: steamId }).eq("user_id", userId);
  } else {
    const username = `steam_${steamId.slice(-8)}`;
    await supabase.from("profiles").insert({
      user_id: userId,
      username,
      steam_id: steamId,
      profile_visibility: "public",
      library_visibility: "public",
      reviews_visibility: "public",
      display_name: `Steam ${steamId.slice(-4)}`,
    });
  }

  if (STEAM_API_KEY) {
    try {
      const ownedUrl =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}` +
        `&steamid=${steamId}&include_played_free_games=1&include_appinfo=1`;

      const data = await fetchJson(ownedUrl);
      const games: Array<{ appid: number; playtime_forever?: number; name?: string }> =
        Array.isArray(data?.response?.games) ? data.response.games : [];

      // Perfil Steam privado: games é undefined/vazio — registra mas não bloqueia o login
      if (games.length === 0) {
        await supabase
          .from("profiles")
          .update({
            steam_last_synced: new Date().toISOString(),
            steam_library_private: true,
          })
          .eq("user_id", userId);
      } else {
        const { data: userGames } = await supabase
          .from("user_games")
          .select("id, app_id")
          .eq("user_id", userId);

        const byAppId = new Map<number, string>();
        for (const row of userGames || []) {
          byAppId.set(row.app_id, row.id);
        }

        const now = new Date().toISOString();
        const inserts: Array<{
          user_id: string;
          app_id: number;
          status: "wishlist" | "playing";
          hours_played: number;
          source: string;
          added_at: string;
          updated_at: string;
        }> = [];
        const catalogRows: Array<{
          app_id: number;
          title: string;
          image: string | null;
          steam_url: string | null;
          last_synced: string;
        }> = [];
        const updates = games
          .map((game) => {
            const id = byAppId.get(game.appid);
            const minutes = Number.isFinite(game.playtime_forever) ? game.playtime_forever || 0 : 0;
            const hours = minutesToHours(minutes);

            if (id) {
              return { id, hours_played: hours, updated_at: now };
            }

            const status = hours > 0 ? "playing" : "wishlist";
            inserts.push({
              user_id: userId!,
              app_id: game.appid,
              status,
              hours_played: hours,
              source: "steam",
              added_at: now,
              updated_at: now,
            });

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

            return null;
          })
          .filter((row): row is { id: string; hours_played: number; updated_at: string } => !!row);

        if (updates.length) {
          await supabase.from("user_games").upsert(updates, { onConflict: "id" });
        }

        if (inserts.length) {
          await supabase.from("user_games").insert(inserts);
        }

        if (catalogRows.length) {
          await supabase.from("games").upsert(catalogRows, { onConflict: "app_id" });
        }

        await supabase
          .from("profiles")
          .update({
            steam_last_synced: now,
            steam_library_private: false,
          })
          .eq("user_id", userId);
      }
    } catch {
      // Best effort: não bloqueia o login em caso de falha na sincronização Steam.
    }
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: safeRedirect },
  });

  if (linkError) {
    return json(500, { error: "magiclink_failed" });
  }

  const actionLink = linkData?.properties?.action_link;
  if (!actionLink) {
    return json(500, { error: "missing_action_link" });
  }

  // Limpa o cookie de nonce após uso
  return new Response(null, {
    status: 302,
    headers: {
      Location: actionLink,
      "Set-Cookie": "steam_nonce=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
});
