import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * xbox-auth-start
 *
 * Inicia o fluxo OAuth 2.0 da Microsoft Identity Platform para login Xbox.
 * O usuário é redirecionado para a tela de login da Microsoft com os escopos
 * necessários para acessar a Xbox Live API.
 *
 * Variáveis de ambiente necessárias:
 *   XBOX_CLIENT_ID   — Application (client) ID do app registrado no Azure
 *   SITE_URL         — URL base do frontend (ex: https://spotlight.app)
 */

const ALLOWED_ORIGINS = [
  "https://spot-light-xi.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const buildRedirect = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    const fallbackOrigin = new URL(fallback).origin;
    if (ALLOWED_ORIGINS.includes(u.origin) || u.origin === fallbackOrigin) {
      return u.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
};

serve((req) => {
  const XBOX_CLIENT_ID = Deno.env.get("XBOX_CLIENT_ID") || "";
  if (!XBOX_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "xbox_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const fallbackSite = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || origin;

  const requestedRedirect = url.searchParams.get("redirect");
  const safeRedirect = buildRedirect(requestedRedirect, fallbackSite);

  // Nonce CSRF
  const nonce = crypto.randomUUID();

  const callbackUrl = `${origin}/functions/v1/xbox-auth-callback`;

  const params = new URLSearchParams({
    client_id: XBOX_CLIENT_ID,
    response_type: "code",
    redirect_uri: callbackUrl,
    scope: "XboxLive.signin XboxLive.offline_access",
    response_mode: "query",
    state: `${nonce}:${encodeURIComponent(safeRedirect)}`,
  });

  const microsoftLoginUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params}`;
  const cookieMaxAge = 60 * 10;

  return new Response(null, {
    status: 302,
    headers: {
      Location: microsoftLoginUrl,
      "Set-Cookie": `xbox_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieMaxAge}`,
    },
  });
});
