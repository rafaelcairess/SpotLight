/**
 * Hook de dados/estado (useDeleteAccount).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId?: string) => {
      const body = targetUserId ? { target_user_id: targetUserId } : {};
      const { data, error } = await supabase.functions.invoke("delete-account", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, targetUserId) => {
      if (targetUserId) {
        queryClient.removeQueries({ queryKey: ["profile", targetUserId] });
        queryClient.removeQueries({ queryKey: ["user_games", targetUserId] });
        queryClient.removeQueries({ queryKey: ["user_top_games", targetUserId] });
        queryClient.removeQueries({ queryKey: ["reviews", "user", targetUserId] });
      }
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "username"] });
    },
  });
}
