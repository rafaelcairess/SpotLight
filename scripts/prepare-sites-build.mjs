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

export default {
  async fetch(request, env) {
    const response = await getAsset(request, env);
    if (response.status !== 404 || request.method !== "GET") {
      return response;
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) {
      return response;
    }

    const indexUrl = new URL("/index.html", request.url);
    return getAsset(new Request(indexUrl, request), env);
  },
};
`;

await mkdir(serverDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });
await writeFile(resolve(serverDir, "index.js"), workerSource, "utf8");
await copyFile(resolve(rootDir, ".openai", "hosting.json"), resolve(metadataDir, "hosting.json"));
