import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImportResult {
  imported: number;
  updated?: number;
  platinumed?: number;
  synced_at?: string;
  warning?: string;
  detail?: string;
}

function useImportMutation(functionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileUrl: string): Promise<ImportResult> => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { profile_url: profileUrl },
      });

      if (error) throw error;

      const result = data as ImportResult & { error?: string };
      if (result?.error) throw new Error(result.detail || result.error);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_games"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export const useImportSteamByUrl = () => useImportMutation("import-steam-by-url");
export const useImportPsnByUrl = () => useImportMutation("import-psn-by-url");
export const useImportXboxByUrl = () => useImportMutation("import-xbox-by-url");
