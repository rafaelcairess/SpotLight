import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
    // Permite origens explicitamente listadas ou a mesma origem do fallback
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
  const safeRedirect = buildRedirect(requestedRedirect, fallbackSite);

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

  // Armazena nonce em cookie HttpOnly com validade de 10 minutos
  const cookieMaxAge = 60 * 10;
  return new Response(null, {
    status: 302,
    headers: {
      Location: steamLoginUrl,
      "Set-Cookie": `steam_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieMaxAge}`,
    },
  });
});
