/**
 * Hook de dados/estado (useSteamPlaytime).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SteamPlaytimeSyncResult {
  updated: number;
  inserted: number;
  steam_total: number;
  synced_at?: string;
  inserted_app_ids?: number[];
  detail_app_ids?: number[];
}

export interface SyncSteamPlaytimeOptions {
  importAll?: boolean;
  enrichDetails?: boolean;
  language?: string;
  mode?: "update" | "import";
}

const runBatches = async <T>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<unknown>
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(handler));
  }
};

export function useSyncSteamPlaytime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: SyncSteamPlaytimeOptions) => {
      const { data, error } = await supabase.functions.invoke("sync-steam-playtime", {
        body: { import_all: options?.importAll === true },
      });

      if (error) throw error;
      const result = data as SteamPlaytimeSyncResult;

      const detailAppIds =
        result?.detail_app_ids && result.detail_app_ids.length > 0
          ? result.detail_app_ids
          : result?.inserted_app_ids ?? [];

      if (options?.enrichDetails && detailAppIds.length > 0) {
        const language = options.language;
        await runBatches(detailAppIds, 6, async (appId) => {
          const { error: detailsError } = await supabase.functions.invoke("fetch-steam-details", {
            body: { app_id: appId, language },
          });
          if (detailsError) {
            // Best effort: ignore errors to continue with other games.
          }
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_games"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
