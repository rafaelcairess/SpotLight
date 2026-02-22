import { useEffect, useState } from "react";

export const useMaturePreference = (
  storageKey = "spotlight.matureContent",
  defaultValue = false
) => {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") setEnabled(true);
    if (stored === "false") setEnabled(false);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, String(enabled));
  }, [enabled, storageKey]);

  return [enabled, setEnabled] as const;
};
