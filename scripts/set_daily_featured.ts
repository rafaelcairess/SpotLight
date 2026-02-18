import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIMEZONE = process.env.FEATURED_TIMEZONE || "America/Sao_Paulo";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const run = async () => {
  const today = formatDate(new Date());

  const { data: existing, error: existingError } = await supabase
    .from("daily_featured")
    .select("id, app_id")
    .eq("featured_date", today)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.app_id) {
    console.log(`[daily_featured] Já definido para ${today}: ${existing.app_id}`);
    return;
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("app_id")
    .order("active_players", { ascending: false })
    .limit(200);

  if (gamesError) throw gamesError;
  if (!games || games.length === 0) {
    throw new Error("No games found to set daily featured");
  }

  const seed = Number(today.replace(/-/g, ""));
  const index = seed % games.length;
  const appId = games[index].app_id;

  const { error: upsertError } = await supabase
    .from("daily_featured")
    .upsert(
      {
        featured_date: today,
        app_id: appId,
      },
      { onConflict: "featured_date" }
    );

  if (upsertError) throw upsertError;
  console.log(`[daily_featured] Definido ${today}: ${appId}`);
};

run().catch((error) => {
  console.error("[daily_featured] Error:", error);
  process.exit(1);
});
