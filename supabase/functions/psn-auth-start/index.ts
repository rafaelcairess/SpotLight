import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * psn-auth-start
 *
 * Inicia o fluxo OAuth 2.0 da Sony/PlayStation Network.
 * O usuário é redirecionado para a tela de login da PSN.
 *
 * Pré-requisito: registrar um app na Sony Developer Network e obter
 * um Client ID com permissão para a Trophy API (psn:trophy).
 *
 * Variáveis de ambiente necessárias:
 *   PSN_CLIENT_ID  — Client ID do app registrado na Sony
 *   SITE_URL       — URL base do frontend
 */

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

serve((req) => {
  const PSN_CLIENT_ID = Deno.env.get("PSN_CLIENT_ID") || "";
  if (!PSN_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "psn_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const fallbackSite = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || origin;

  let baseOrigin = origin;
  try {
    baseOrigin = new URL(fallbackSite).origin;
  } catch {
    baseOrigin = origin;
  }

  const requestedRedirect = url.searchParams.get("redirect");
  const safeRedirect = buildRedirect(requestedRedirect, baseOrigin);

  // Nonce CSRF
  const nonce = crypto.randomUUID();

  const callbackUrl = `${origin}/functions/v1/psn-auth-callback`;

  const params = new URLSearchParams({
    client_id: PSN_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "psn:mobile.v2.core psn:trophy",
    state: `${nonce}:${encodeURIComponent(safeRedirect)}`,
  });

  const psnLoginUrl = `https://ca.account.sony.com/api/authz/v3/oauth/authorize?${params}`;
  const cookieMaxAge = 60 * 10;

  return new Response(null, {
    status: 302,
    headers: {
      Location: psnLoginUrl,
      "Set-Cookie": `psn_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieMaxAge}`,
    },
  });
});
