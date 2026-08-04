/**
 * Recomendações pessoais com geração de candidatos, pontuação e diversidade.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { GameData } from "@/types/game";
import { rankPersonalRecommendations, type RecommendationProfileGame } from "@/lib/recommendations";

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
  steam_url: string | null;
};

type UserGameRow = {
  app_id: number;
  status: "wishlist" | "playing" | "completed" | "dropped";
  is_favorite: boolean;
  is_platinumed: boolean;
  hours_played: number | null;
  hours_played_manual: number | null;
  hours_override: boolean;
};

type ReviewRow = {
  app_id: number;
  is_positive: boolean;
  score: number | null;
};

type CandidateGameRow = Pick<
  GameRow,
  "app_id" | "title" | "image" | "genre" | "tags" | "active_players" | "community_rating"
>;

export interface RecommendedGame extends GameData {
  recommendationScore: number;
  matchedTags: string[];
}

const mapGameRow = (row: GameRow): GameData => ({
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
});

const mapCandidate = (row: CandidateGameRow): GameData => ({
  app_id: row.app_id,
  title: row.title,
  image: row.image || "",
  genre: row.genre || undefined,
  tags: row.tags || undefined,
  activePlayers: row.active_players ?? undefined,
  communityRating: row.community_rating ?? undefined,
});

export function useRecommendations(limit = 10, includeMature = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["games", "recommendations", user?.id, limit, includeMature],
    queryFn: async () => {
      if (!user?.id) return [] as RecommendedGame[];

      const [userGamesResult, reviewsResult] = await Promise.all([
        supabase
          .from("user_games")
          .select(
            "app_id, status, is_favorite, is_platinumed, hours_played, hours_played_manual, hours_override",
          )
          .eq("user_id", user.id),
        supabase.from("reviews").select("app_id, is_positive, score").eq("user_id", user.id),
      ]);

      if (userGamesResult.error) throw userGamesResult.error;
      if (reviewsResult.error) throw reviewsResult.error;

      const profileGames = (userGamesResult.data || []) as UserGameRow[];
      const reviews = (reviewsResult.data || []) as ReviewRow[];

      // Gera candidatos por qualidade e por popularidade antes de pontuar o gosto pessoal.
      const [ownedGamesResult, qualityCandidatesResult, popularCandidatesResult] =
        await Promise.all([
          profileGames.length
            ? supabase
                .from("games")
                .select("app_id, genre, tags")
                .in(
                  "app_id",
                  profileGames.map((game) => game.app_id),
                )
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from("games")
            .select("app_id, title, image, genre, tags, active_players, community_rating")
            .order("community_rating", { ascending: false })
            .limit(350),
          supabase
            .from("games")
            .select("app_id, title, image, genre, tags, active_players, community_rating")
            .order("active_players", { ascending: false })
            .limit(250),
        ]);

      if (ownedGamesResult.error) throw ownedGamesResult.error;
      if (qualityCandidatesResult.error) throw qualityCandidatesResult.error;
      if (popularCandidatesResult.error) throw popularCandidatesResult.error;

      const ownedGames = (ownedGamesResult.data || []) as Pick<
        GameRow,
        "app_id" | "genre" | "tags"
      >[];
      const ownedGameMap = new Map(ownedGames.map((game) => [game.app_id, game]));
      const recommendationProfile = profileGames.flatMap((game) => {
        const catalogGame = ownedGameMap.get(game.app_id);
        return catalogGame ? [{ ...game, ...catalogGame } as RecommendationProfileGame] : [];
      });

      const candidateGames = Array.from(
        new Map(
          [
            ...((qualityCandidatesResult.data || []) as CandidateGameRow[]),
            ...((popularCandidatesResult.data || []) as CandidateGameRow[]),
          ].map((game) => [game.app_id, game]),
        ).values(),
      );

      const selected = rankPersonalRecommendations({
        candidates: candidateGames.map(mapCandidate),
        profileGames: recommendationProfile,
        reviews,
        limit,
        includeMature,
      });

      if (!selected.length) return [];

      const { data: detailedGames, error: detailedGamesError } = await supabase
        .from("games")
        .select("*")
        .in(
          "app_id",
          selected.map(({ game }) => game.app_id),
        );

      if (detailedGamesError) throw detailedGamesError;
      const detailsById = new Map(
        ((detailedGames || []) as GameRow[]).map((game) => [game.app_id, game]),
      );

      return selected.map(({ game, recommendationScore, matchedTags }) => ({
        ...(detailsById.has(game.app_id)
          ? mapGameRow(detailsById.get(game.app_id) as GameRow)
          : game),
        recommendationScore,
        matchedTags,
      }));
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
