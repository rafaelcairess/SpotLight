import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameData } from "@/types/game";
import { TOP_GAMES_SERIES_CURATED } from "@/data/topGamesSeriesCurated";

type GameRow = {
  app_id: number;
  title: string;
  image: string | null;
  short_description: string | null;
  genre: string | null;
  tags: string[] | null;
  active_players: number | null;
  community_rating: number | null;
  price: string | null;
  price_original: string | null;
  discount_percent: number | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[] | null;
};

export interface RankedGame extends GameData {
  isCurated: boolean;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const includesAny = (title: string, terms: string[]) => {
  const normalizedTitle = normalize(title);
  return terms.some((term) => normalizedTitle.includes(normalize(term)));
};

const mapGameRow = (row: GameRow): GameData => ({
  app_id: row.app_id,
  title: row.title,
  image: row.image || "",
  short_description: row.short_description || undefined,
  genre: row.genre || undefined,
  tags: row.tags || undefined,
  activePlayers: row.active_players || undefined,
  communityRating: row.community_rating || undefined,
  price: row.price || undefined,
  priceOriginal: row.price_original || undefined,
  discountPercent: row.discount_percent || undefined,
  releaseDate: row.release_date || undefined,
  developer: row.developer || undefined,
  publisher: row.publisher || undefined,
  platforms: row.platforms || undefined,
});

const matchesGenreAndTag = (game: GameData, genreFilter: string, tagFilter: string) => {
  const normalizedGenreFilter = normalize(genreFilter);
  const normalizedTagFilter = normalize(tagFilter);

  const tokens = [
    ...(game.genre ? game.genre.split(",") : []),
    ...(game.tags || []),
  ]
    .map((token) => normalize(token))
    .filter(Boolean);

  const genreOk = normalizedGenreFilter
    ? tokens.some((token) => token.includes(normalizedGenreFilter))
    : true;
  const tagOk = normalizedTagFilter
    ? tokens.some((token) => token.includes(normalizedTagFilter))
    : true;

  return genreOk && tagOk;
};

export function useTopGamesRanking(genreFilter = "", tagFilter = "", limit = 100) {
  return useQuery({
    queryKey: ["games", "ranking", "curated", genreFilter, tagFilter, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .limit(800);

      if (error) throw error;

      const allGames = ((data || []) as GameRow[]).map(mapGameRow);
      const takenIds = new Set<number>();

      const curated: RankedGame[] = [];
      for (const entry of TOP_GAMES_SERIES_CURATED) {
        const found = allGames.find(
          (game) =>
            !takenIds.has(game.app_id) &&
            includesAny(game.title, entry.match) &&
            matchesGenreAndTag(game, genreFilter, tagFilter)
        );

        if (!found) continue;
        takenIds.add(found.app_id);
        curated.push({ ...found, isCurated: true });
      }

      const remaining = allGames
        .filter((game) => !takenIds.has(game.app_id))
        .filter((game) => matchesGenreAndTag(game, genreFilter, tagFilter))
        .sort((a, b) => {
          const playersDiff = (b.activePlayers || 0) - (a.activePlayers || 0);
          if (playersDiff !== 0) return playersDiff;
          return (b.communityRating || 0) - (a.communityRating || 0);
        })
        .map((game) => ({ ...game, isCurated: false as const }));

      return [...curated, ...remaining].slice(0, limit);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
