import { isMatureGame } from "@/lib/matureFilter";
import type { GameData } from "@/types/game";

const STEAM_MONTHS: Record<string, number> = {
  jan: 0, fev: 1, feb: 1, mar: 2, abr: 3, apr: 3, mai: 4, may: 4,
  jun: 5, jul: 6, ago: 7, aug: 7, set: 8, sep: 8, oct: 9, out: 9,
  nov: 10, dez: 11, dec: 11,
};

const normalizeReleaseDate = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bde\b/g, " ")
    .replace(/[.,]/g, "")
    .replace(/[/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const parseSteamReleaseDate = (value?: string): Date | null => {
  if (!value) return null;
  const parts = normalizeReleaseDate(value).split(" ");
  if (parts.length < 3) return null;

  const day = Number(parts[0]);
  const month = STEAM_MONTHS[parts[1].slice(0, 3)];
  const year = Number(parts[parts.length - 1]);
  if (!Number.isInteger(day) || month === undefined || !Number.isInteger(year)) return null;

  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasUsefulCardData = (game: GameData) => Boolean(game.title && game.image);

const qualityScore = (game: GameData) =>
  (game.communityRating ?? 0) * 0.72 + Math.log10((game.activePlayers ?? 0) + 1) * 6;

export const rankQualityGames = (games: GameData[], includeMature = false) =>
  games
    .filter(hasUsefulCardData)
    .filter((game) => includeMature || !isMatureGame(game))
    .filter((game) => (game.communityRating ?? 0) >= 82)
    .filter((game) => (game.activePlayers ?? 0) >= 200)
    .sort((a, b) => qualityScore(b) - qualityScore(a));

export const rankNoteworthyReleases = (
  games: GameData[],
  now = new Date(),
  includeMature = false,
) => {
  const newestAllowed = new Date(now);
  newestAllowed.setUTCDate(newestAllowed.getUTCDate() + 30);
  const oldestAllowed = new Date(now);
  oldestAllowed.setUTCMonth(oldestAllowed.getUTCMonth() - 18);

  return games
    .filter(hasUsefulCardData)
    .filter((game) => includeMature || !isMatureGame(game))
    .filter((game) => (game.communityRating ?? 0) >= 75)
    .filter((game) => (game.activePlayers ?? 0) >= 100)
    .map((game) => ({ game, releasedAt: parseSteamReleaseDate(game.releaseDate) }))
    .filter(
      (item): item is { game: GameData; releasedAt: Date } =>
        Boolean(item.releasedAt && item.releasedAt >= oldestAllowed && item.releasedAt <= newestAllowed),
    )
    .sort((a, b) => {
      const dateDifference = b.releasedAt.getTime() - a.releasedAt.getTime();
      return dateDifference || qualityScore(b.game) - qualityScore(a.game);
    })
    .map(({ game }) => game);
};
