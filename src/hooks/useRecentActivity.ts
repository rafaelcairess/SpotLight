import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRecentActivity(userId?: string) {
  return useQuery({
    queryKey: ["profile-recent-activity", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_games")
        .select("app_id, hours_played, playtime_2weeks, last_played_at")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .not("last_played_at", "is", null)
        .order("last_played_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
