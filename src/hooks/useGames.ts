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
  });
}
