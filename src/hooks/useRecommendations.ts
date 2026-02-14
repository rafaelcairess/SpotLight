import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
  steam_url: string | null;
};

type UserGameRow = {
  app_id: number;
  status: "wishlist" | "playing" | "completed" | "dropped";
  is_favorite: boolean;
  is_platinumed: boolean;
  hours_played: number | null;
};

type ReviewRow = {
  app_id: number;
  is_positive: boolean;
  score: number | null;
};

export interface RecommendedGame extends GameData {
  recommendationScore: number;
  matchedTags: string[];
}

const normalizeToken = (value: string) => value.trim().toLowerCase();

const gameToTokens = (game: Pick<GameRow, "genre" | "tags">): string[] => {
  const genreTokens = (game.genre || "")
    .split(",")
    .map((token) => normalizeToken(token))
    .filter(Boolean);
  const tagTokens = (game.tags || []).map((token) => normalizeToken(token)).filter(Boolean);
  return Array.from(new Set([...genreTokens, ...tagTokens]));
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

export function useRecommendations(limit = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["games", "recommendations", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [] as RecommendedGame[];

      const [{ data: userGames, error: userGamesError }, { data: userReviews, error: reviewsError }] = await Promise.all([
        supabase
          .from("user_games")
          .select("app_id, status, is_favorite, is_platinumed, hours_played")
          .eq("user_id", user.id),
        supabase
          .from("reviews")
          .select("app_id, is_positive, score")
          .eq("user_id", user.id),
      ]);

      if (userGamesError) throw userGamesError;
      if (reviewsError) throw reviewsError;

      const profileGames = (userGames || []) as UserGameRow[];
      const reviews = (userReviews || []) as ReviewRow[];
      const ownedAppIds = new Set(profileGames.map((game) => game.app_id));

      const [ownedGamesResult, candidateGamesResult] = await Promise.all([
        profileGames.length
          ? supabase
              .from("games")
              .select("app_id, genre, tags")
              .in("app_id", profileGames.map((game) => game.app_id))
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("games")
          .select("*")
          .order("community_rating", { ascending: false })
          .limit(500),
      ]);

      if (ownedGamesResult.error) throw ownedGamesResult.error;
      if (candidateGamesResult.error) throw candidateGamesResult.error;

      const ownedGames = (ownedGamesResult.data || []) as Pick<GameRow, "app_id" | "genre" | "tags">[];
      const candidateGames = (candidateGamesResult.data || []) as GameRow[];

      const ownedGameMap = new Map(ownedGames.map((game) => [game.app_id, game]));
      const tagWeights = new Map<string, number>();

      const addWeight = (token: string, weight: number) => {
        const current = tagWeights.get(token) || 0;
        tagWeights.set(token, current + weight);
      };

      for (const game of profileGames) {
        const catalogGame = ownedGameMap.get(game.app_id);
        if (!catalogGame) continue;

        let baseWeight = 2;
        if (game.is_favorite) baseWeight += 2;
        if (game.is_platinumed) baseWeight += 3;
        if (game.status === "completed") baseWeight += 1;
        if (typeof game.hours_played === "number" && game.hours_played > 0) {
          baseWeight += Math.min(3, game.hours_played / 40);
        }

        for (const token of gameToTokens(catalogGame)) {
          addWeight(token, baseWeight);
        }
      }

      for (const review of reviews) {
        const catalogGame = ownedGameMap.get(review.app_id);
        if (!catalogGame) continue;
        const positiveSignal = (review.score ?? (review.is_positive ? 4 : 2)) >= 3;
        const weight = positiveSignal ? 2 : -1;
        for (const token of gameToTokens(catalogGame)) {
          addWeight(token, weight);
        }
      }

      const recommendations: RecommendedGame[] = [];
      for (const game of candidateGames) {
        if (ownedAppIds.has(game.app_id)) continue;
        const tokens = gameToTokens(game);
        if (tokens.length === 0) continue;

        let tagScore = 0;
        const matchedTags: string[] = [];

        for (const token of tokens) {
          const tokenWeight = tagWeights.get(token) || 0;
          if (tokenWeight > 0) {
            tagScore += tokenWeight;
            matchedTags.push(token);
          }
        }

        if (tagScore <= 0) continue;

        const ratingScore = (game.community_rating || 0) * 0.08;
        const popularityScore = game.active_players
          ? Math.log10(game.active_players + 1) * 3
          : 0;

        recommendations.push({
          ...mapGameRow(game),
          recommendationScore: tagScore + ratingScore + popularityScore,
          matchedTags: Array.from(new Set(matchedTags)).slice(0, 3),
        });
      }

      if (recommendations.length === 0) {
        return candidateGames
          .filter((game) => !ownedAppIds.has(game.app_id))
          .sort((a, b) => (b.active_players || 0) - (a.active_players || 0))
          .slice(0, limit)
          .map((game) => ({
            ...mapGameRow(game),
            recommendationScore: 0,
            matchedTags: [],
          }));
      }

      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
