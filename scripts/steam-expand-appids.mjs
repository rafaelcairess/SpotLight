import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    process.env[key] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const STEAM_API_KEY = (process.env.STEAM_API_KEY || "").trim();
const TARGET_ADD = Number(process.argv[2] || 200);

const appIdsPath = path.join(__dirname, "steam-popular-appids.json");
const current = JSON.parse(fs.readFileSync(appIdsPath, "utf8"));
const existing = new Set(current);

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

const collectFeaturedIds = (data) => {
  const ids = new Set();

  const walk = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") {
      const hasName = typeof value.name === "string" || typeof value.title === "string";
      const appid = typeof value.appid === "number" ? value.appid : null;
      const id = typeof value.id === "number" && hasName ? value.id : null;
      if (appid) ids.add(appid);
      if (id) ids.add(id);
      Object.values(value).forEach(walk);
    }
  };

  walk(data);
  return Array.from(ids);
};

const collectSteamSpy = (data) => Object.keys(data || {}).map((id) => Number(id)).filter(Number.isFinite);

const sources = [];

if (STEAM_API_KEY) {
  try {
    const charts = await fetchJson(
      `https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?key=${STEAM_API_KEY}&count=200`
    );
    const ranks = charts?.response?.ranks || [];
    sources.push(ranks.map((item) => item.appid).filter(Number.isFinite));
  } catch (err) {
    console.warn("Steam charts fetch failed:", err.message || err);
  }
}

try {
  const featured = await fetchJson("https://store.steampowered.com/api/featuredcategories?cc=us&l=english");
  sources.push(collectFeaturedIds(featured));
} catch (err) {
  console.warn("Featured categories fetch failed:", err.message || err);
}

try {
  const topForever = await fetchJson("https://steamspy.com/api.php?request=top100forever");
  sources.push(collectSteamSpy(topForever));
} catch (err) {
  console.warn("SteamSpy top100forever fetch failed:", err.message || err);
}

try {
  const topOwned = await fetchJson("https://steamspy.com/api.php?request=top100owned");
  sources.push(collectSteamSpy(topOwned));
} catch (err) {
  console.warn("SteamSpy top100owned fetch failed:", err.message || err);
}

try {
  const topTwoWeeks = await fetchJson("https://steamspy.com/api.php?request=top100in2weeks");
  sources.push(collectSteamSpy(topTwoWeeks));
} catch (err) {
  console.warn("SteamSpy top100in2weeks fetch failed:", err.message || err);
}

const tagSeeds = [
  "Action",
  "RPG",
  "Adventure",
  "Sports",
  "Racing",
  "Horror",
];

for (const tag of tagSeeds) {
  try {
    const data = await fetchJson(
      `https://steamspy.com/api.php?request=tag&tag=${encodeURIComponent(tag)}`
    );
    sources.push(collectSteamSpy(data));
  } catch (err) {
    console.warn(`SteamSpy tag ${tag} fetch failed:`, err.message || err);
  }
}

const added = [];
for (const list of sources) {
  for (const appId of list) {
    if (!existing.has(appId)) {
      existing.add(appId);
      added.push(appId);
      if (added.length >= TARGET_ADD) break;
    }
  }
  if (added.length >= TARGET_ADD) break;
}

const next = Array.from(existing);
fs.writeFileSync(appIdsPath, JSON.stringify(next, null, 2) + "\n", "utf8");

console.log(`Added ${added.length} app ids. Total now: ${next.length}`);
