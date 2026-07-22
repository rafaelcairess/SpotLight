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
  platinum_synced?: number;
  platinum_next_offset?: number | null;
  platinum_candidates?: number;
}

export interface SyncSteamPlaytimeOptions {
  importAll?: boolean;
  enrichDetails?: boolean;
  language?: string;
  mode?: "update" | "import";
  syncPlatinums?: boolean;
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

const getFunctionError = async (error: unknown) => {
  const fallback = error instanceof Error ? error.message : "Falha desconhecida na sincronização";
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.clone !== "function") return new Error(fallback);
  try {
    const body = await context.clone().json() as { error?: string; detail?: string };
    return new Error([body.error, body.detail].filter(Boolean).join(": ") || fallback);
  } catch {
    return new Error(fallback);
  }
};

export function useSyncSteamPlaytime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: SyncSteamPlaytimeOptions) => {
      let offset: number | null = 0;
      let platinumTotal = 0;
      let result: SteamPlaytimeSyncResult | null = null;

      do {
        let page: SteamPlaytimeSyncResult | null = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 2 && !page; attempt += 1) {
          const { data, error } = await supabase.functions.invoke("sync-steam-playtime", {
            body: {
              import_all: options?.importAll === true,
              sync_platinums: options?.syncPlatinums === true,
              platinum_offset: options?.syncPlatinums ? offset : undefined,
            },
          });
          if (error) lastError = await getFunctionError(error);
          else page = data as SteamPlaytimeSyncResult;
        }
        if (!page) throw lastError instanceof Error ? lastError : new Error("Steam sync page failed");
        result = page;
        platinumTotal += result.platinum_synced || 0;
        offset = options?.syncPlatinums ? result.platinum_next_offset ?? null : null;
      } while (offset !== null);

      if (!result) throw new Error("Steam sync returned no result");
      result.platinum_synced = platinumTotal;

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
