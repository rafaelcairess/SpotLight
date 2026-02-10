import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameData } from "@/types/game";

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

type ReviewScoreRow = {
  app_id: number;
  score: number | null;
};

export interface RankedGame extends GameData {
  weightedScore: number;
  averageScore: number;
  votes: number;
}

const M = 20;

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

const normalizeToken = (value: string) => value.trim().toLowerCase();

const parseTokens = (game: GameData) => {
  const tags = (game.tags || []).map(normalizeToken);
  const genres = (game.genre || "")
    .split(",")
    .map(normalizeToken)
    .filter(Boolean);
  return Array.from(new Set([...tags, ...genres]));
};

export function useTopGamesRanking(genreFilter = "", tagFilter = "", limit = 100) {
  return useQuery({
    queryKey: ["games", "ranking", genreFilter, tagFilter, limit],
    queryFn: async () => {
      const [{ data: reviews, error: reviewsError }, { data: games, error: gamesError }] = await Promise.all([
        supabase.from("reviews").select("app_id, score").not("score", "is", null),
        supabase.from("games").select("*").limit(600),
      ]);

      if (reviewsError) throw reviewsError;
      if (gamesError) throw gamesError;

      const scoreRows = (reviews || []) as ReviewScoreRow[];
      const gameRows = (games || []) as GameRow[];

      if (scoreRows.length === 0 || gameRows.length === 0) {
        return [] as RankedGame[];
      }

      const globalAverage =
        scoreRows.reduce((acc, row) => acc + (row.score || 0), 0) / scoreRows.length;

      const statsMap = new Map<number, { total: number; votes: number }>();
      for (const row of scoreRows) {
        if (typeof row.score !== "number") continue;
        const current = statsMap.get(row.app_id) || { total: 0, votes: 0 };
        current.total += row.score;
        current.votes += 1;
        statsMap.set(row.app_id, current);
      }

      const ranked: RankedGame[] = [];
      for (const row of gameRows) {
        const stats = statsMap.get(row.app_id);
        if (!stats || stats.votes === 0) continue;

        const game = mapGameRow(row);
        const averageScore = stats.total / stats.votes;
        const weightedScore = (stats.votes / (stats.votes + M)) * averageScore + (M / (stats.votes + M)) * globalAverage;

        ranked.push({
          ...game,
          averageScore,
          votes: stats.votes,
          weightedScore,
        });
      }

      const normalizedGenre = normalizeToken(genreFilter);
      const normalizedTag = normalizeToken(tagFilter);

      const filtered = ranked.filter((game) => {
        const tokens = parseTokens(game);
        const genreMatches = normalizedGenre
          ? tokens.some((token) => token.includes(normalizedGenre))
          : true;
        const tagMatches = normalizedTag
          ? tokens.some((token) => token.includes(normalizedTag))
          : true;
        return genreMatches && tagMatches;
      });

      return filtered
        .sort((a, b) => {
          if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
          if (b.votes !== a.votes) return b.votes - a.votes;
          return (b.activePlayers || 0) - (a.activePlayers || 0);
        })
        .slice(0, limit);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
