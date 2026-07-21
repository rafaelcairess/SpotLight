/**
 * Hook de dados/estado (useLayoutPreference).
 */

import type { LayoutMode } from "@/components/LayoutToggle";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { STORAGE_KEYS } from "@/config/storageKeys";

export const useLayoutPreference = (
  storageKey: string = STORAGE_KEYS.layoutMode.base,
  defaultMode: LayoutMode = "standard"
) => {
  return useLocalStorageState<LayoutMode>(
    storageKey,
    defaultMode,
    (raw) => (raw === "standard" || raw === "compact" ? raw : null),
    (value) => value
  );
};
