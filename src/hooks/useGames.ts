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
  steam_url: string | null;
  last_synced: string;
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

export function usePopularGames(limit = 10) {
  return useQuery({
    queryKey: ["games", "popular", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTopRatedGames(limit = 12) {
  return useQuery({
    queryKey: ["games", "top-rated", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("community_rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAllGames(limit = 200) {
  return useQuery({
    queryKey: ["games", "all", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("last_synced", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useDiscountedGames(limit = 30) {
  return useQuery({
    queryKey: ["games", "discounted", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .gt("discount_percent", 0)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useDiscountedGamesPaged(limit = 30, page = 1) {
  return useQuery({
    queryKey: ["games", "discounted", "paged", limit, page],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("games")
        .select("*", { count: "exact" })
        .gt("discount_percent", 0)
        .order("active_players", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        games: (data as GameRow[]).map(mapGameRow),
        count: count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useGamesByIds(appIds: number[]) {
  const uniqueIds = Array.from(new Set(appIds.filter((id) => Number.isFinite(id))));

  return useQuery({
    queryKey: ["games", "by-ids", uniqueIds],
    queryFn: async () => {
      if (uniqueIds.length === 0) return [];

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("app_id", uniqueIds);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    enabled: uniqueIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSearchGames(query: string, limit = 20) {
  const normalized = query.trim();

  return useQuery({
    queryKey: ["games", "search", normalized, limit],
    queryFn: async () => {
      if (normalized.length < 2) return [];

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .ilike("title", `%${normalized}%`)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as GameRow[]).map(mapGameRow);
    },
    enabled: normalized.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDailyFeaturedGame() {
  return useQuery({
    queryKey: ["games", "featured", "daily"],
    queryFn: async () => {
      const { data: featured, error: featuredError } = await supabase
        .from("daily_featured")
        .select("app_id, featured_date")
        .order("featured_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (featuredError) throw featuredError;
      if (!featured?.app_id) return null;

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("app_id", featured.app_id)
        .single();

      if (gameError) throw gameError;
      return mapGameRow(game as GameRow);
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
