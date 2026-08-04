import { useCallback, useState } from "react";
import type { GameData } from "@/types/game";

/** Keeps the selected-game modal state consistent across catalog pages. */
export function useGameSelection<T extends GameData = GameData>() {
  const [selectedGame, setSelectedGame] = useState<T | null>(null);
  const openGame = useCallback((game: T) => setSelectedGame(game), []);
  const closeGame = useCallback(() => setSelectedGame(null), []);

  return {
    selectedGame,
    isGameOpen: Boolean(selectedGame),
    openGame,
    closeGame,
    setSelectedGame,
  };
}
