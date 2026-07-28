const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const oauthSecurityHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export const oauthNonceCookies = {
  steam: "__Host-spotlight_steam_nonce",
  xbox: "__Host-spotlight_xbox_nonce",
  psn: "__Host-spotlight_psn_nonce",
} as const;

const parseHttpUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
};

/**
 * OAuth may return only to the configured site origin. Localhost is disabled
 * in deployed functions unless ALLOW_LOCAL_REDIRECTS=true is explicitly set.
 */
export const buildSafeRedirect = (value: string | null, fallback: string): string => {
  const fallbackUrl = parseHttpUrl(fallback);
  if (!fallbackUrl) throw new Error("invalid_site_url");

  const target = value ? parseHttpUrl(value) : null;
  if (!target) return fallbackUrl.toString();
  if (target.origin === fallbackUrl.origin) return target.toString();

  const localRedirectsEnabled = Deno.env.get("ALLOW_LOCAL_REDIRECTS") === "true";
  if (localRedirectsEnabled && target.protocol === "http:" && LOOPBACK_HOSTS.has(target.hostname)) {
    return target.toString();
  }

  return fallbackUrl.toString();
};

export const setNonceCookie = (name: string, nonce: string) =>
  `${name}=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;

export const clearNonceCookie = (name: string) =>
  `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return part.slice(separator + 1).trim() || null;
  }
  return null;
};

export const decodeOAuthState = (
  state: string,
): { nonce: string; redirect: string | null } | null => {
  if (state.length > 4096) return null;
  const separator = state.indexOf(":");
  if (separator < 1) return null;

  const nonce = state.slice(0, separator);
  const encodedRedirect = state.slice(separator + 1);
  try {
    return {
      nonce,
      redirect: encodedRedirect ? decodeURIComponent(encodedRedirect) : null,
    };
  } catch {
    return null;
  }
};
