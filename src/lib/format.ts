/**
 * Helpers utilitarios (format).
 */

// Helpers pequenos para formatacao usada em varios lugares da UI.

export const formatPlayers = (count?: number) => {
  if (!count) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
};

export const getRatingColorClass = (rating?: number) => {
  if (!rating) return "text-muted-foreground";
  if (rating >= 80) return "rating-positive";
  if (rating >= 50) return "rating-mixed";
  return "rating-negative";
};

export const isFreePrice = (price?: string) => price === "Free" || price === "0";
