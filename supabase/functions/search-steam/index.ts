// @ts-expect-error Deno resolves remote modules at runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

type SearchItem = {
  app_id: number;
  title: string;
  image?: string;
};

const parseResults = (html: string, limit: number, seen: Set<number>) => {
  const items: SearchItem[] = [];
  const rowRegex = /<a[^>]+class="search_result_row[^"]*"[^>]*>[\s\S]*?<\/a>/g;
  const rows = html.match(rowRegex) || [];

  for (const row of rows) {
    if (items.length >= limit) break;

    const appIdMatch = row.match(/data-ds-appid="([^"]+)"/);
    if (!appIdMatch) continue;

    const appIdRaw = appIdMatch[1].split(",")[0];
    const appId = Number(appIdRaw);
    if (!Number.isFinite(appId) || appId <= 0) continue;
    if (seen.has(appId)) continue;

    const titleMatch = row.match(/<span class="title">([^<]+)<\/span>/);
    const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : `App ${appId}`;

    const imageMatch = row.match(/<img[^>]+src="([^"]+)"/);
    const image = imageMatch ? imageMatch[1] : undefined;

    seen.add(appId);
    items.push({ app_id: appId, title, image });
  }

  return items;
};

const fetchJson = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SpotLight/1.0 (+https://github.com/rafaelcairess/SpotLight)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  let payload: {
    query?: string;
    limit?: number;
    cc?: string;
    language?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const query = (payload.query || "").trim();
  if (query.length < 2) {
    return json(400, { error: "invalid_query" });
  }

  const limit = Math.min(50, Math.max(1, Number(payload.limit ?? 30)));
  const cc = (payload.cc || "br").trim();
  const denoEnv = (globalThis as { Deno?: { env?: { get: (key: string) => string | undefined } } }).Deno?.env;
  const language = (payload.language || denoEnv?.get("STEAM_STORE_LANGUAGE") || "brazilian").trim();

  const items: SearchItem[] = [];
  const seen = new Set<number>();
  const count = 50;
  let start = 0;

  try {
    while (items.length < limit) {
      const url =
        "https://store.steampowered.com/search/results/?" +
        `term=${encodeURIComponent(query)}` +
        `&count=${count}` +
        `&start=${start}` +
        "&category1=998" +
        "&infinite=1" +
        `&cc=${encodeURIComponent(cc)}` +
        `&l=${encodeURIComponent(language)}`;

      const data = await fetchJson(url);
      const html = data?.results_html || "";
      const total = Number(data?.total_count ?? 0);

      if (!html) {
        break;
      }

      const parsed = parseResults(html, limit - items.length, seen);
      if (parsed.length === 0) {
        break;
      }

      items.push(...parsed);
      start += count;

      if (total && start >= total) {
        break;
      }
    }

    return json(200, { items });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(500, { error: "search_failed", details: message });
  }
});
