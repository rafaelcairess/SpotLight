/**
 * Hook de dados/estado (useMaturePreference).
 */

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { STORAGE_KEYS } from "@/config/storageKeys";

export const useMaturePreference = () =>
  useLocalStorageState<boolean>(
    STORAGE_KEYS.matureContent,
    false,
    (raw) => {
      if (raw === "true") return true;
      if (raw === "false") return false;
      return null;
    },
    (value) => String(value)
  );
