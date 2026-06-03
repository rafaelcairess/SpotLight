/**
 * Hook de dados/estado (useDeleteAccount).
 */

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (targetUserId?: string) => {
      const body = targetUserId ? { target_user_id: targetUserId } : {};
      const { data, error } = await supabase.functions.invoke("delete-account", { body });
      if (error) throw error;
      return data;
    },
  });
}
