import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const normalizePlatforms = (platforms: Record<string, boolean> | null | undefined) => {
  if (!platforms || typeof platforms !== "object") return null;
  return Object.entries(platforms)
    .filter(([, supported]) => supported)
    .map(([name]) => name);
};

const normalizeGenres = (genres: Array<{ description?: string }> | null | undefined) => {
  if (!Array.isArray(genres)) return [];
  return genres
    .map((g) => g?.description)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
};

const normalizeCategories = (categories: Array<{ description?: string }> | null | undefined) => {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => c?.description)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
};

const normalizeTags = (genres: unknown, categories: unknown) => {
  const values = [
    ...normalizeGenres(genres as Array<{ description?: string }> | null | undefined),
    ...normalizeCategories(categories as Array<{ description?: string }> | null | undefined),
  ];
  if (!values.length) return [];
  return Array.from(new Set(values));
};

const normalizePriceInfo = (details: any) => {
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

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY") || "";
  const STEAM_STORE_LANGUAGE = Deno.env.get("STEAM_STORE_LANGUAGE") || "brazilian";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }

  let payload: { app_id?: number };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const appId = Number(payload.app_id);
  if (!Number.isFinite(appId)) {
    return json(400, { error: "invalid_app_id" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=br&l=${STEAM_STORE_LANGUAGE}`;
    const detailsResponse = await fetchJson(detailsUrl);
    const entry = detailsResponse?.[appId];
    if (!entry?.success) {
      return json(404, { error: "not_found" });
    }

    const details = entry.data;
    if (details?.type !== "game") {
      await supabase
        .from("steam_apps")
        .upsert(
          {
            app_id: appId,
            name: details?.name ?? `App ${appId}`,
            is_game: false,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "app_id" },
        );
      return json(200, { status: "not_game", app_id: appId });
    }

    const [playersData, reviewData] = await Promise.all([
      STEAM_API_KEY
        ? fetchJson(
            `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&key=${STEAM_API_KEY}`,
          ).catch(() => null)
        : Promise.resolve(null),
      fetchJson(
        `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=0&language=all&purchase_type=all`,
      ).catch(() => null),
    ]);

    const activePlayers = playersData?.response?.player_count ?? null;
    const summary = reviewData?.query_summary;
    const communityRating =
      summary?.total_reviews && summary.total_reviews > 0
        ? Math.round((summary.total_positive / summary.total_reviews) * 100)
        : null;

    const priceInfo = normalizePriceInfo(details);
    const tags = normalizeTags(details.genres, details.categories);
    const genres = normalizeGenres(details.genres);

    const row = {
      app_id: appId,
      title: details.name,
      image: details.header_image ?? null,
      short_description: details.short_description ?? null,
      genre: genres[0] ?? null,
      tags: tags.length ? tags : null,
      active_players: activePlayers,
      community_rating: communityRating,
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

    const { error: upsertError } = await supabase
      .from("games")
      .upsert(row, { onConflict: "app_id" });
    if (upsertError) throw upsertError;

    await supabase
      .from("steam_apps")
      .upsert(
        {
          app_id: appId,
          name: details.name,
          is_game: true,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "app_id" },
      );

    return json(200, { status: "ok", app_id: appId });
  } catch (error) {
    return json(500, { error: "fetch_failed", details: `${error?.message ?? error}` });
  }
});
