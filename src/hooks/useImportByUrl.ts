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

// Steam: usa a função já deployada (sync-steam-playtime) com import_all + steam_id via URL
export function useImportSteamByUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileUrl: string): Promise<ImportResult> => {
      const { data, error } = await supabase.functions.invoke("sync-steam-playtime", {
        body: { steam_id: profileUrl, import_all: true },
      });

      if (error) throw error;

      const result = data as Record<string, unknown>;
      if (result?.error) throw new Error((result.detail as string) || (result.error as string));

      // Biblioteca privada ou vazia
      if ((result?.steam_total as number) === 0) {
        throw new Error("Nenhum jogo encontrado. Verifique se sua biblioteca Steam está pública.");
      }

      return {
        imported: (result?.inserted as number) ?? 0,
        updated: (result?.updated as number) ?? 0,
        synced_at: result?.synced_at as string,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_games"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

// PSN e Xbox: chamarão as novas funções quando forem deployadas
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

export const useImportPsnByUrl = () => useImportMutation("import-psn-by-url");
export const useImportXboxByUrl = () => useImportMutation("import-xbox-by-url");
