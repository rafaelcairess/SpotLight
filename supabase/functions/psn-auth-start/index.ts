import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  buildSafeRedirect,
  oauthNonceCookies,
  oauthSecurityHeaders,
  setNonceCookie,
} from "../_shared/oauth-security.ts";

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

serve((req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const PSN_CLIENT_ID = Deno.env.get("PSN_CLIENT_ID") || "";
  if (!PSN_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "psn_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const fallbackSite =
    Deno.env.get("SITE_URL") ||
    Deno.env.get("PUBLIC_SITE_URL") ||
    "https://spot-light-xi.vercel.app";

  const requestedRedirect = url.searchParams.get("redirect");
  const safeRedirect = buildSafeRedirect(requestedRedirect, fallbackSite);

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
  return new Response(null, {
    status: 302,
    headers: {
      Location: psnLoginUrl,
      "Set-Cookie": setNonceCookie(oauthNonceCookies.psn, nonce),
      ...oauthSecurityHeaders,
    },
  });
});
