import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  buildSafeRedirect,
  oauthNonceCookies,
  oauthSecurityHeaders,
  setNonceCookie,
} from "../_shared/oauth-security.ts";

serve((req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
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

  // Gera nonce aleatório para proteção CSRF
  const nonce = crypto.randomUUID();

  const callbackUrl = new URL(`${origin}/functions/v1/steam-auth-callback`);
  callbackUrl.searchParams.set("redirect", safeRedirect);
  callbackUrl.searchParams.set("nonce", nonce);

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callbackUrl.toString(),
    "openid.realm": origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: steamLoginUrl,
      "Set-Cookie": setNonceCookie(oauthNonceCookies.steam, nonce),
      ...oauthSecurityHeaders,
    },
  });
});
