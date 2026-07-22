import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatinumShowcase(userId?: string) {
  return useQuery({
    queryKey: ["profile-platinum-showcase", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_games")
        .select("app_id, hours_played, platinum_platforms")
        .eq("user_id", userId)
        .eq("is_platinumed", true)
        .eq("is_hidden", false)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
