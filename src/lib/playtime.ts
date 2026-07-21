/**
 * Helpers utilitarios (playtime).
 */

import type { UserGame } from "@/hooks/useUserGames";

export const getEffectiveHours = (
  game: Pick<UserGame, "hours_played" | "hours_played_manual" | "hours_override">
) => {
  if (game.hours_override && typeof game.hours_played_manual === "number") {
    return game.hours_played_manual;
  }
  return typeof game.hours_played === "number" ? game.hours_played : null;
};

export const hasManualOverride = (
  game: Pick<UserGame, "hours_played_manual" | "hours_override">
) => Boolean(game.hours_override && typeof game.hours_played_manual === "number");
