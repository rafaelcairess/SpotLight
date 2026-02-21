import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (filename: string) => {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const STEAM_API_KEY = (process.env.STEAM_API_KEY || "").trim();
const STEAM_APP_LIST_URL = (process.env.STEAM_APP_LIST_URL || "").trim();
const GITHUB_APP_LIST_URL = (
  process.env.GITHUB_APP_LIST_URL ||
  "https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/games_appid.json"
).trim();

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL not found. Check .env or set SUPABASE_URL.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found. Add it to .env.local.");
}
const USER_AGENT =
  process.env.STEAM_USER_AGENT || "SpotLight/1.0 (+https://github.com/rafaelcairess/SpotLight)";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fetchJson = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status} for ${url}`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const batchSize = 1000;
  const now = new Date().toISOString();
  let synced = 0;
  let lastAppId = 0;
  let safety = 0;

  const upsertBatch = async (apps: { appid: number; name: string }[]) => {
    for (let i = 0; i < apps.length; i += batchSize) {
      const slice = apps.slice(i, i + batchSize);
      const batch = slice
        .filter((app) => Number.isFinite(app.appid) && app.name)
        .map((app) => ({
          app_id: app.appid,
          name: app.name,
          last_seen: now,
        }));

      if (!batch.length) continue;

      const { error } = await supabase
        .from("steam_apps")
        .upsert(batch, { onConflict: "app_id" });

      if (error) throw error;
      synced += batch.length;
      console.log(`Upserted ${synced}`);
      await sleep(200);
    }
  };

  const tryIStoreService = async () => {
    if (!STEAM_API_KEY) {
      throw new Error("STEAM_API_KEY not found for IStoreService.");
    }

    while (true) {
      const url =
        `https://api.steampowered.com/IStoreService/GetAppList/v1/` +
        `?key=${encodeURIComponent(STEAM_API_KEY)}` +
        `&max_results=50000` +
        `&last_appid=${lastAppId}`;
      const data = await fetchJson(url);
      const response = data?.response ?? {};
      const apps: { appid: number; name: string }[] = response.apps ?? [];

      if (!apps.length) {
        throw new Error("No apps found in Steam app list.");
      }

      await upsertBatch(apps);

      const nextLastAppId = Number(response.last_appid ?? 0);
      if (!Number.isFinite(nextLastAppId) || nextLastAppId === 0 || nextLastAppId === lastAppId) {
        break;
      }

      lastAppId = nextLastAppId;
      safety += 1;
      if (safety > 200) {
        throw new Error("Safety stop: too many pages while syncing app list.");
      }
      await sleep(250);
    }
  };

  const tryGitHubAppList = async () => {
    const data = await fetchJson(GITHUB_APP_LIST_URL);
    const apps: { appid: number; name: string }[] = Array.isArray(data) ? data : [];
    if (!apps.length) {
      throw new Error(`No apps found in GitHub app list from ${GITHUB_APP_LIST_URL}`);
    }
    await upsertBatch(apps);
  };

  const tryPublicAppList = async () => {
    const urls: string[] = [];
    if (STEAM_APP_LIST_URL) {
      urls.push(STEAM_APP_LIST_URL);
    } else {
      urls.push("https://api.steampowered.com/ISteamApps/GetAppList/v2/");
      if (STEAM_API_KEY) {
        urls.push(
          `https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${encodeURIComponent(STEAM_API_KEY)}`
        );
      }
      urls.push("https://api.steampowered.com/ISteamApps/GetAppList/v0002/");
      urls.push("https://steamcommunity.com/ISteamApps/GetAppList/v0002/");
      if (STEAM_API_KEY) {
        urls.push(
          `https://api.steampowered.com/ISteamApps/GetAppList/v0002/?key=${encodeURIComponent(
            STEAM_API_KEY
          )}`
        );
        urls.push(
          `https://steamcommunity.com/ISteamApps/GetAppList/v0002/?key=${encodeURIComponent(
            STEAM_API_KEY
          )}`
        );
      }
    }

    let lastError: Error | null = null;
    for (const url of urls) {
      try {
        const data = await fetchJson(url);
        const apps: { appid: number; name: string }[] = data?.applist?.apps ?? [];
        if (!apps.length) {
          throw new Error(`No apps found in Steam app list from ${url}`);
        }
        await upsertBatch(apps);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`App list fetch failed for ${url}: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("No app list endpoints available.");
  };

  if (STEAM_API_KEY) {
    try {
      await tryIStoreService();
    } catch (error) {
      console.warn("IStoreService failed. Trying GitHub app list first.");
      try {
        await tryGitHubAppList();
      } catch (githubError) {
        console.warn(`GitHub app list fetch failed: ${(githubError as Error).message}`);
        await tryPublicAppList();
      }
    }
  } else {
    try {
      await tryGitHubAppList();
    } catch (githubError) {
      console.warn(`GitHub app list fetch failed: ${(githubError as Error).message}`);
      await tryPublicAppList();
    }
  }

  console.log(`Done. Total synced: ${synced}`);
};

run().catch((error) => {
  console.error("Steam app list sync failed:", error?.message || error);
  process.exit(1);
});
