import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserTopGame {
  id: string;
  user_id: string;
  app_id: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useUserTopGames(userId?: string, useAuthFallback = true) {
  const { user } = useAuth();
  const targetUserId = userId ?? (useAuthFallback ? user?.id : undefined);

  return useQuery({
    queryKey: ["user_top_games", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [] as UserTopGame[];

      const { data, error } = await supabase
        .from("user_top_games")
        .select("*")
        .eq("user_id", targetUserId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as UserTopGame[];
    },
    enabled: !!targetUserId,
  });
}

export function useSetTopGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ position, appId }: { position: number; appId: number | null }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (position < 1 || position > 5) throw new Error("Invalid position");

      if (!appId) {
        const { error } = await supabase
          .from("user_top_games")
          .delete()
          .eq("user_id", user.id)
          .eq("position", position);
        if (error) throw error;
        return;
      }

      // Ensure same game is not in another slot
      await supabase
        .from("user_top_games")
        .delete()
        .eq("user_id", user.id)
        .eq("app_id", appId);

      const { data, error } = await supabase
        .from("user_top_games")
        .upsert(
          {
            user_id: user.id,
            app_id: appId,
            position,
          },
          { onConflict: "user_id,position" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as UserTopGame;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_top_games"] });
    },
  });
}
