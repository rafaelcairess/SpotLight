import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GameData } from "@/types/game";
import { mapGameRow } from "@/hooks/useGames";

export function useFavoriteGame(profileUserId?: string, appId?: number | null) {
  return useQuery({
    queryKey: ["favorite-game", profileUserId, appId],
    queryFn: async () => {
      if (!profileUserId || !appId) return null;
      const { data: ownership, error: ownershipError } = await supabase.from("user_games").select("app_id").eq("user_id", profileUserId).eq("app_id", appId).maybeSingle();
      if (ownershipError) throw ownershipError;
      if (!ownership) return null;
      const { data, error } = await supabase.from("games").select("*").eq("app_id", appId).maybeSingle();
      if (error) throw error;
      return data ? mapGameRow(data) as GameData : null;
    },
    enabled: !!profileUserId && !!appId,
  });
}
