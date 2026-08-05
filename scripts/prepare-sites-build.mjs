import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const distDir = resolve(rootDir, "dist");
const serverDir = resolve(distDir, "server");
const metadataDir = resolve(distDir, ".openai");

const workerSource = `const getAsset = (request, env) => {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return new Response("Static asset binding is unavailable.", { status: 500 });
  }

  return env.ASSETS.fetch(request);
};

const getRuntimeConfig = (env) => {
  const runtimeConfig = JSON.stringify({
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  }).replaceAll("<", "\\u003c");

  return new Response(\`globalThis.__SPOTLIGHT_ENV__=\${runtimeConfig};\`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};

const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; manifest-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests",
  );
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/runtime-env.js") {
      return withSecurityHeaders(getRuntimeConfig(env));
    }

    let response = await getAsset(request, env);
    if (response.status !== 404 || request.method !== "GET") {
      return withSecurityHeaders(response);
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) {
      return withSecurityHeaders(response);
    }

    const indexUrl = new URL("/index.html", request.url);
    response = await getAsset(new Request(indexUrl, request), env);
    return withSecurityHeaders(response);
  },
};
`;

await mkdir(serverDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });
await writeFile(resolve(serverDir, "index.js"), workerSource, "utf8");
await copyFile(resolve(rootDir, ".openai", "hosting.json"), resolve(metadataDir, "hosting.json"));
