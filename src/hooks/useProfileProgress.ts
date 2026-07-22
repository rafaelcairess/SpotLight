import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileProgress {
  xp: number; level: number; next_level_xp: number; games_count: number;
  completed_count: number; platinum_count: number; reviews_count: number;
  friends_count: number; hours_count: number;
}

export function useProfileProgress(userId?: string) {
  return useQuery({
    queryKey: ["profile-progress", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("get_profile_progress", { target_user_id: userId });
      if (error) throw error;
      return (data?.[0] || null) as ProfileProgress | null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
