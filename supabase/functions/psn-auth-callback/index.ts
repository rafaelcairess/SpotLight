import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * psn-auth-callback
 *
 * Processa o retorno OAuth 2.0 da Sony PSN, troca o code por tokens,
 * busca o PSN Account ID e o Online ID (nome de usuário), e cria/atualiza
 * o perfil no Supabase.
 *
 * Variáveis de ambiente necessárias:
 *   PSN_CLIENT_ID
 *   PSN_CLIENT_SECRET
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
  const PSN_CLIENT_ID = Deno.env.get("PSN_CLIENT_ID") || "";
  const PSN_CLIENT_SECRET = Deno.env.get("PSN_CLIENT_SECRET") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!PSN_CLIENT_ID || !PSN_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    return json(400, { error: "psn_auth_denied", detail: error });
  }

  if (!code || !state) {
    return json(400, { error: "missing_code_or_state" });
  }

  // ── Validação CSRF ──────────────────────────────────────────────
  const [nonceFromState, encodedRedirect] = state.split(":");
  const nonceFromCookie = getCookie(req.headers.get("cookie"), "psn_nonce");

  if (!nonceFromState || !nonceFromCookie || nonceFromState !== nonceFromCookie) {
    return json(403, { error: "csrf_nonce_mismatch" });
  }

  const safeRedirectRaw = encodedRedirect ? decodeURIComponent(encodedRedirect) : baseOrigin;
  let safeRedirect = baseOrigin;
  try {
    const resolved = new URL(safeRedirectRaw, baseOrigin);
    if (resolved.origin === baseOrigin) safeRedirect = resolved.toString();
  } catch { /* usa baseOrigin */ }
  // ───────────────────────────────────────────────────────────────

  const callbackUrl = `${url.origin}/functions/v1/psn-auth-callback`;

  // ── Troca code por tokens PSN ───────────────────────────────────
  const tokenRes = await fetch("https://ca.account.sony.com/api/authz/v3/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${PSN_CLIENT_ID}:${PSN_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    return json(502, { error: "token_exchange_failed", status: tokenRes.status });
  }

  const tokenData = await tokenRes.json();
  const psnAccessToken: string = tokenData.access_token;

  if (!psnAccessToken) {
    return json(500, { error: "no_access_token" });
  }

  // ── Busca informações do usuário PSN ───────────────────────────
  const profileRes = await fetch("https://m.np.playstation.com/api/userProfile/v1/internal/users/me/profiles", {
    headers: {
      Authorization: `Bearer ${psnAccessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!profileRes.ok) {
    return json(502, { error: "psn_profile_fetch_failed" });
  }

  const profileData = await profileRes.json();
  const psnAccountId: string = profileData.profile?.accountId || profileData.accountId;
  const psnOnlineId: string = profileData.profile?.onlineId || profileData.onlineId;

  if (!psnAccountId) {
    return json(500, { error: "psn_account_id_missing" });
  }

  // ── Salva no Supabase ───────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const fakeEmail = `psn_${psnAccountId}@psn.local`;

  let userId: string | undefined;

  const { data: existingUser } = await supabase.auth.admin.getUserByEmail(fakeEmail);
  if (existingUser?.user?.id) {
    userId = existingUser.user.id;
  } else {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      email_confirm: true,
      user_metadata: { psn_id: psnAccountId, provider: "psn" },
    });
    if (createError || !createdUser?.user?.id) {
      return json(500, { error: "user_create_failed" });
    }
    userId = createdUser.user.id;
  }

  if (!userId) return json(500, { error: "user_missing" });

  const now = new Date().toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.id) {
    await supabase.from("profiles").update({
      psn_id: psnAccountId,
      psn_online_id: psnOnlineId,
      psn_last_synced: now,
    }).eq("user_id", userId);
  } else {
    await supabase.from("profiles").insert({
      user_id: userId,
      username: `psn_${psnOnlineId || psnAccountId.slice(-8)}`,
      psn_id: psnAccountId,
      psn_online_id: psnOnlineId,
      psn_last_synced: now,
      profile_visibility: "public",
      library_visibility: "public",
      reviews_visibility: "public",
      display_name: psnOnlineId || `PSN ${psnAccountId.slice(-4)}`,
    });
  }

  // Dispara sync de troféus em background
  const syncUrl = `${url.origin}/functions/v1/sync-psn-trophies`;
  fetch(syncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      psn_account_id: psnAccountId,
      psn_access_token: psnAccessToken,
    }),
  }).catch(() => { /* best effort */ });

  // Gera magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: fakeEmail,
    options: { redirectTo: safeRedirect },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return json(500, { error: "magiclink_failed" });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: linkData.properties.action_link,
      "Set-Cookie": "psn_nonce=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
});
