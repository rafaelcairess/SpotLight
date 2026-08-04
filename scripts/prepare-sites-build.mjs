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

const injectRuntimeConfig = async (response, env) => {
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }

  const runtimeConfig = JSON.stringify({
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  }).replaceAll("<", "\\u003c");
  const html = (await response.text()).replace(
    "</head>",
    \`<script>globalThis.__SPOTLIGHT_ENV__=\${runtimeConfig};</script></head>\`,
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env) {
    let response = await getAsset(request, env);
    if (response.status !== 404 || request.method !== "GET") {
      return injectRuntimeConfig(response, env);
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) {
      return response;
    }

    const indexUrl = new URL("/index.html", request.url);
    response = await getAsset(new Request(indexUrl, request), env);
    return injectRuntimeConfig(response, env);
  },
};
`;

await mkdir(serverDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });
await writeFile(resolve(serverDir, "index.js"), workerSource, "utf8");
await copyFile(resolve(rootDir, ".openai", "hosting.json"), resolve(metadataDir, "hosting.json"));
