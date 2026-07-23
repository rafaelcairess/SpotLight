import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatinumShowcase(userId?: string) {
  return useQuery({
    queryKey: ["profile-platinum-showcase", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_games")
        .select("id, app_id, hours_played, hours_played_manual, hours_override, platinum_platforms")
        .eq("user_id", userId)
        .eq("is_platinumed", true)
        .eq("is_hidden", false)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((game) => ({
        ...game,
        hours_played:
          game.hours_override && typeof game.hours_played_manual === "number"
            ? game.hours_played_manual
            : game.hours_played,
      }));
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
