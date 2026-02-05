import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (filename) => {
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STEAM_API_KEY) {
  throw new Error("STEAM_API_KEY not found. Add it to .env.local.");
}
if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL not found. Check .env or set SUPABASE_URL.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found. Add it to .env.local.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const appIdsPath = path.join(__dirname, "steam-popular-appids.json");
const appIds = JSON.parse(fs.readFileSync(appIdsPath, "utf8"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

const getAppDetails = async (appId) => {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=br&l=pt`;
  const data = await fetchJson(url);
  const entry = data?.[appId];
  if (!entry?.success) return null;
  return entry.data;
};

const getCurrentPlayers = async (appId) => {
  const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&key=${STEAM_API_KEY}`;
  const data = await fetchJson(url);
  return data?.response?.player_count ?? null;
};

const getReviewPercent = async (appId) => {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=0&language=all&purchase_type=all`;
  const data = await fetchJson(url);
  const summary = data?.query_summary;
  if (!summary || !summary.total_reviews) return null;
  return Math.round((summary.total_positive / summary.total_reviews) * 100);
};

const normalizePlatforms = (platforms) => {
  if (!platforms || typeof platforms !== "object") return null;
  return Object.entries(platforms)
    .filter(([, supported]) => supported)
    .map(([name]) => name);
};

const normalizeGenres = (genres) => {
  if (!Array.isArray(genres)) return [];
  return genres
    .map((g) => g?.description)
    .filter((value) => typeof value === "string" && value.length > 0);
};

const normalizePriceInfo = (details) => {
  if (details?.is_free) {
    return { price: "Grátis", priceOriginal: null, discountPercent: null };
  }

  const priceOverview = details?.price_overview;
  if (!priceOverview) {
    return { price: null, priceOriginal: null, discountPercent: null };
  }

  const discountPercent = Number.isFinite(priceOverview.discount_percent)
    ? priceOverview.discount_percent
    : null;

  return {
    price: priceOverview.final_formatted || null,
    priceOriginal:
      discountPercent && discountPercent > 0
        ? priceOverview.initial_formatted || null
        : null,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
  };
};

let successCount = 0;
let failCount = 0;

for (const appId of appIds) {
  try {
    const details = await getAppDetails(appId);
    if (!details) {
      console.warn(`Skipping app ${appId}: no details.`);
      failCount += 1;
      continue;
    }

    const [activePlayers, reviewPercent] = await Promise.all([
      getCurrentPlayers(appId),
      getReviewPercent(appId),
    ]);

    const genres = normalizeGenres(details.genres);
    const priceInfo = normalizePriceInfo(details);
    const row = {
      app_id: appId,
      title: details.name,
      image: details.header_image ?? null,
      short_description: details.short_description ?? null,
      genre: genres[0] ?? null,
      tags: genres.length ? genres : null,
      active_players: activePlayers,
      community_rating: reviewPercent,
      price: priceInfo.price,
      price_original: priceInfo.priceOriginal,
      discount_percent: priceInfo.discountPercent,
      release_date: details.release_date?.date ?? null,
      developer: Array.isArray(details.developers) ? details.developers[0] ?? null : null,
      publisher: Array.isArray(details.publishers) ? details.publishers[0] ?? null : null,
      platforms: normalizePlatforms(details.platforms),
      steam_url: `https://store.steampowered.com/app/${appId}`,
      last_synced: new Date().toISOString(),
    };

    const { error } = await supabase.from("games").upsert(row, {
      onConflict: "app_id",
    });
    if (error) {
      throw error;
    }
    successCount += 1;
    console.log(`Synced ${appId} - ${row.title}`);
  } catch (err) {
    console.error(`Failed ${appId}:`, err.message || err);
    failCount += 1;
  }

  await sleep(300);
}

console.log(`Done. Success: ${successCount}, Failed: ${failCount}`);
