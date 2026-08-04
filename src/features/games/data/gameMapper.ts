import type { Database } from "@/integrations/supabase/types";
import type { GameData } from "@/types/game";

export type GameRow = Database["public"]["Tables"]["games"]["Row"];

/** Single boundary between Supabase snake_case rows and the UI game model. */
export const mapGameRow = (row: GameRow): GameData => ({
  app_id: row.app_id,
  title: row.title,
  image: row.image || "",
  short_description: row.short_description || undefined,
  genre: row.genre || undefined,
  tags: row.tags || undefined,
  activePlayers: row.active_players ?? undefined,
  communityRating: row.community_rating ?? undefined,
  price: row.price || undefined,
  priceOriginal: row.price_original || undefined,
  discountPercent: row.discount_percent ?? undefined,
  releaseDate: row.release_date || undefined,
  developer: row.developer || undefined,
  publisher: row.publisher || undefined,
  platforms: row.platforms || undefined,
  backgroundImage: row.background_image || undefined,
  trailerUrl: row.trailer_url || undefined,
  trailerThumbnail: row.trailer_thumbnail || undefined,
  screenshots: row.screenshot_urls || undefined,
  mediaSyncedAt: row.media_synced_at || undefined,
});

export const mapGameRows = (rows: GameRow[] | null | undefined) => (rows ?? []).map(mapGameRow);
