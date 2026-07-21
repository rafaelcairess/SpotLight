import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * xbox-auth-callback
 *
 * Processa o retorno OAuth 2.0 da Microsoft, troca o code por tokens,
 * busca o XUID e o Gamertag do usuário na Xbox Live API, e cria/atualiza
 * o perfil no Supabase.
 *
 * Variáveis de ambiente necessárias:
 *   XBOX_CLIENT_ID      — Application (client) ID do Azure
 *   XBOX_CLIENT_SECRET  — Client secret do Azure
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SITE_URL
 */

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === name) return v ?? null;
  }
  return null;
};

serve(async (req) => {
  const XBOX_CLIENT_ID = Deno.env.get("XBOX_CLIENT_ID") || "";
  const XBOX_CLIENT_SECRET = Deno.env.get("XBOX_CLIENT_SECRET") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!XBOX_CLIENT_ID || !XBOX_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return json(400, { error: "xbox_auth_denied", detail: error });
  }

  if (!code || !state) {
    return json(400, { error: "missing_code_or_state" });
  }

  // ── Validação CSRF ──────────────────────────────────────────────
  const [nonceFromState, encodedRedirect] = state.split(":");
  const nonceFromCookie = getCookie(req.headers.get("cookie"), "xbox_nonce");

  if (!nonceFromState || !nonceFromCookie || nonceFromState !== nonceFromCookie) {
    return json(403, { error: "csrf_nonce_mismatch" });
  }

  const ALLOWED_ORIGINS = [
    "https://spot-light-xi.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const safeRedirectRaw = encodedRedirect ? decodeURIComponent(encodedRedirect) : fallbackSite;
  let safeRedirect = fallbackSite;
  try {
    const u = new URL(safeRedirectRaw);
    if (u.protocol === "http:" || u.protocol === "https:") {
      if (ALLOWED_ORIGINS.includes(u.origin) || u.origin === new URL(fallbackSite).origin) {
        safeRedirect = u.toString();
      }
    }
  } catch { /* usa fallbackSite */ }
  // ───────────────────────────────────────────────────────────────

  const callbackUrl = `${url.origin}/functions/v1/xbox-auth-callback`;

  // ── Troca code por tokens Microsoft ────────────────────────────
  const tokenRes = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: XBOX_CLIENT_ID,
      client_secret: XBOX_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    return json(502, { error: "token_exchange_failed" });
  }

  const tokenData = await tokenRes.json();
  const msAccessToken: string = tokenData.access_token;
  const msRefreshToken: string | undefined = tokenData.refresh_token;

  if (!msAccessToken) {
    return json(500, { error: "no_access_token" });
  }

  // ── Troca token Microsoft por token Xbox Live ───────────────────
  const xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: `d=${msAccessToken}`,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    }),
  });

  if (!xblRes.ok) {
    return json(502, { error: "xbl_auth_failed" });
  }

  const xblData = await xblRes.json();
  const xblToken: string = xblData.Token;
  const userHash: string = xblData.DisplayClaims?.xui?.[0]?.uhs;

  if (!xblToken || !userHash) {
    return json(500, { error: "xbl_token_missing" });
  }

  // ── Troca XBL token por XSTS token ─────────────────────────────
  const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      Properties: { SandboxId: "RETAIL", UserTokens: [xblToken] },
      RelyingParty: "http://xboxlive.com",
      TokenType: "JWT",
    }),
  });

  if (!xstsRes.ok) {
    const xstsErr = await xstsRes.json().catch(() => ({}));
    // Código 2148916233 = conta sem Xbox Live; 2148916238 = menor de idade
    return json(502, { error: "xsts_auth_failed", detail: xstsErr });
  }

  const xstsData = await xstsRes.json();
  const xstsToken: string = xstsData.Token;
  const xuid: string = xstsData.DisplayClaims?.xui?.[0]?.xid;
  const gamertag: string = xstsData.DisplayClaims?.xui?.[0]?.gtg || "";

  if (!xstsToken || !xuid) {
    return json(500, { error: "xsts_claims_missing" });
  }

  // ── Salva no Supabase ───────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verifica se já existe usuário vinculado a este XUID
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("xbox_id", xuid)
    .maybeSingle();

  const fakeEmail = `xbox_${xuid}@xbox.local`;
  const adminHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
  };

  let userId: string | undefined;

  if (existingProfile?.user_id) {
    userId = existingProfile.user_id;
  } else {
    // Busca usuário pelo email via REST API
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(fakeEmail)}&page=1&per_page=1`,
      { headers: adminHeaders }
    );
    const listData = await listRes.json();
    const existingUser = listData?.users?.[0];

    if (existingUser?.id) {
      userId = existingUser.id;
    } else {
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          email: fakeEmail,
          email_confirm: true,
          user_metadata: { xbox_id: xuid, provider: "xbox" },
        }),
      });
      const createdUser = await createRes.json();
      if (!createRes.ok || !createdUser?.id) {
        return json(500, { error: "user_create_failed", detail: createdUser?.message });
      }
      userId = createdUser.id;
    }
  }

  if (!userId) return json(500, { error: "user_missing" });

  // Atualiza perfil com dados Xbox
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (profile?.id) {
    await supabase.from("profiles").update({
      xbox_id: xuid,
      xbox_gamertag: gamertag,
      xbox_last_synced: now,
    }).eq("user_id", userId);
  } else {
    await supabase.from("profiles").insert({
      user_id: userId,
      username: `xbox_${xuid.slice(-8)}`,
      xbox_id: xuid,
      xbox_gamertag: gamertag,
      xbox_last_synced: now,
      profile_visibility: "public",
      library_visibility: "public",
      reviews_visibility: "public",
      display_name: gamertag || `Xbox ${xuid.slice(-4)}`,
    });
  }

  // Dispara sync de biblioteca em background (fire and forget)
  const syncUrl = `${url.origin}/functions/v1/sync-xbox-library`;
  fetch(syncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ user_id: userId, xuid, xsts_token: xstsToken, user_hash: userHash }),
  }).catch(() => { /* best effort */ });

  // Gera magic link via REST API direta
  const generateLinkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ type: "magiclink", email: fakeEmail, redirect_to: safeRedirect }),
  });

  if (!generateLinkRes.ok) {
    console.error("magiclink_failed status:", generateLinkRes.status);
    return json(500, { error: "magiclink_failed" });
  }

  const generateLinkData = await generateLinkRes.json();
  const actionLink = generateLinkData?.action_link;

  if (!actionLink) {
    return json(500, { error: "missing_action_link" });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: actionLink,
      "Set-Cookie": "xbox_nonce=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
});
