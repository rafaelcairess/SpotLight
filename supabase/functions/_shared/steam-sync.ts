export type SteamIdCandidate =
  { type: "steamid"; value: string } | { type: "vanity"; value: string };

export const isSteamId64 = (value: string) => /^\d{17}$/.test(value);

export function parseSteamInput(raw?: string | null): SteamIdCandidate | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "steamcommunity.com" || url.hostname.endsWith(".steamcommunity.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "profiles" && parts[1]) return { type: "steamid", value: parts[1] };
      if (parts[0] === "id" && parts[1]) return { type: "vanity", value: parts[1] };
    }
  } catch {
    // Entradas simples (SteamID ou vanity) não são URLs.
  }

  return isSteamId64(trimmed)
    ? { type: "steamid", value: trimmed }
    : { type: "vanity", value: trimmed };
}

export const minutesToHours = (minutes: number) =>
  Math.round((Math.max(0, minutes) / 60) * 100) / 100;
