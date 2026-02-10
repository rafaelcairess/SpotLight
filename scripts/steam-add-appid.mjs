import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const term = process.argv.slice(2).join(" ").trim();
if (!term) {
  console.error("Usage: node scripts/steam-add-appid.mjs <game name>");
  process.exit(1);
}

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
  term
)}&l=english&cc=us`;

const data = await fetchJson(searchUrl);
const items = Array.isArray(data?.items) ? data.items : [];

if (items.length === 0) {
  console.error("No results found for:", term);
  process.exit(1);
}

const normalizedTerm = term.toLowerCase();
let selected = items.find((item) => item?.name?.toLowerCase() === normalizedTerm);
if (!selected) {
  selected = items[0];
}

const appId = selected?.id;
const name = selected?.name;
if (!appId) {
  console.error("No app id found for:", term);
  process.exit(1);
}

const appIdsPath = path.join(__dirname, "steam-popular-appids.json");
const list = JSON.parse(fs.readFileSync(appIdsPath, "utf8"));
const set = new Set(list);
if (!set.has(appId)) {
  list.push(appId);
  fs.writeFileSync(appIdsPath, JSON.stringify(list, null, 2) + "\n", "utf8");
}

console.log(`Added: ${name} (${appId})`);
