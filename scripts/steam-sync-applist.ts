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

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL not found. Check .env or set SUPABASE_URL.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found. Add it to .env.local.");
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
  const data = await fetchJson("https://api.steampowered.com/ISteamApps/GetAppList/v2/");
  const apps: { appid: number; name: string }[] = data?.applist?.apps ?? [];
  if (!apps.length) {
    throw new Error("No apps found in Steam app list.");
  }

  const batchSize = 1000;
  const now = new Date().toISOString();
  let synced = 0;

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
    console.log(`Upserted ${synced}/${apps.length}`);
    await sleep(200);
  }

  console.log(`Done. Total synced: ${synced}`);
};

run().catch((error) => {
  console.error("Steam app list sync failed:", error?.message || error);
  process.exit(1);
});
