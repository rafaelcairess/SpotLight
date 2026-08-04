/**
 * Hook de dados/estado (useMostPlayedGames).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapGameRows, type GameRow } from "@/features/games/data/gameMapper";

export function useMostPlayedGames(limit = 50) {
  return useQuery({
    queryKey: ["games", "most-played", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .not("active_players", "is", null)
        .gt("active_players", 0)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return mapGameRows(data as GameRow[]);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
