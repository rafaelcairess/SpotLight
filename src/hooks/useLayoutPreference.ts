import { useEffect, useState } from "react";
import type { LayoutMode } from "@/components/LayoutToggle";

const STORAGE_KEY = "spotlight.layoutMode";

export const useLayoutPreference = () => {
  const [mode, setMode] = useState<LayoutMode>("standard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "standard" || stored === "compact") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return [mode, setMode] as const;
};
