import { createClient } from "@supabase/supabase-js";

const STEAM_API_KEY = (process.env.STEAM_API_KEY || "").trim();
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!STEAM_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing STEAM_API_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchPlayerCount = async (appId, attempt = 0) => {
  const url =
    `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/` +
    `?appid=${appId}&key=${encodeURIComponent(STEAM_API_KEY)}`;
  const response = await fetch(url);

  if (response.status === 429 && attempt < 3) {
    await sleep(1_500 * 2 ** attempt);
    return fetchPlayerCount(appId, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const count = data?.response?.player_count;
  return Number.isFinite(count) ? count : null;
};

const run = async () => {
  const { data: games, error } = await supabase
    .from("games")
    .select("app_id, title")
    .not("title", "is", null)
    .limit(1000);

  if (error) throw error;
  if (!games?.length) throw new Error("No games available for ranking refresh");

  const now = new Date().toISOString();
  let updated = 0;
  let failed = 0;

  for (let index = 0; index < games.length; index += 10) {
    const batch = games.slice(index, index + 10);
    const results = await Promise.all(
      batch.map(async (game) => {
        try {
          const activePlayers = await fetchPlayerCount(game.app_id);
          return activePlayers === null
            ? null
            : { app_id: game.app_id, title: game.title, active_players: activePlayers, last_synced: now };
        } catch (refreshError) {
          console.warn(`[rankings] ${game.app_id}: ${refreshError.message || refreshError}`);
          failed += 1;
          return null;
        }
      }),
    );

    const rows = results.filter(Boolean);
    if (rows.length) {
      const { error: upsertError } = await supabase
        .from("games")
        .upsert(rows, { onConflict: "app_id" });
      if (upsertError) throw upsertError;
      updated += rows.length;
    }
    await sleep(250);
  }

  console.log(`[rankings] Updated: ${updated}; failed: ${failed}; total: ${games.length}`);
  if (updated === 0 || failed > games.length * 0.2) {
    throw new Error("Ranking refresh failed for too many games");
  }
};

run().catch((error) => {
  console.error("Steam ranking refresh failed:", error?.message || error);
  process.exit(1);
});
