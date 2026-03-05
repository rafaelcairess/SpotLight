/**
 * Helpers utilitários (sort).
 */

export const sortByPopularity = <T extends { activePlayers?: number; communityRating?: number; title?: string }>(
  items: T[]
) =>
  [...items].sort((a, b) => {
    const playersDiff = (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
    if (playersDiff !== 0) return playersDiff;
    const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
