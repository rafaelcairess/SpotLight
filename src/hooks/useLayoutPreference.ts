import { useEffect, useState } from "react";
import type { LayoutMode } from "@/components/LayoutToggle";

export const useLayoutPreference = (
  storageKey = "spotlight.layoutMode",
  defaultMode: LayoutMode = "standard"
) => {
  const [mode, setMode] = useState<LayoutMode>(defaultMode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "standard" || stored === "compact") {
      setMode(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, mode);
  }, [mode, storageKey]);

  return [mode, setMode] as const;
};
