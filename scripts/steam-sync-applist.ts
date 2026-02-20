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

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL not found. Check .env or set SUPABASE_URL.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found. Add it to .env.local.");
}
if (!STEAM_API_KEY) {
  throw new Error("STEAM_API_KEY not found. Add it to .env.local.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
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

  console.log(`Done. Total synced: ${synced}`);
};

run().catch((error) => {
  console.error("Steam app list sync failed:", error?.message || error);
  process.exit(1);
});
