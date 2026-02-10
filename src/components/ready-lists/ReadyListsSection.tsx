import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { READY_LISTS } from "@/data/readyLists";
import { useAllGames, useGamesByIds } from "@/hooks/useGames";
import GameCard from "@/components/GameCard";
import SectionHeader from "@/components/SectionHeader";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { GameData } from "@/types/game";

interface ReadyListsSectionProps {
  onGameClick: (game: GameData) => void;
}

const normalizeToken = (value: string) => value.trim().toLowerCase();

const gameTokens = (game: GameData) => {
  const genreTokens = (game.genre || "")
    .split(",")
    .map(normalizeToken)
    .filter(Boolean);
  const tagTokens = (game.tags || []).map(normalizeToken).filter(Boolean);
  return Array.from(new Set([...genreTokens, ...tagTokens]));
};

export default function ReadyListsSection({ onGameClick }: ReadyListsSectionProps) {
  const allManualIds = useMemo(
    () => Array.from(new Set(READY_LISTS.flatMap((list) => list.appIds))),
    []
  );

  const { data: allGames = [], isLoading: allGamesLoading } = useAllGames(400);
  const { data: manualGames = [], isLoading: manualLoading } = useGamesByIds(allManualIds);

  const manualGameMap = useMemo(
    () => new Map(manualGames.map((game) => [game.app_id, game])),
    [manualGames]
  );

  const lists = useMemo(() => {
    return READY_LISTS.map((list) => {
      const pinned = list.appIds
        .map((appId) => manualGameMap.get(appId))
        .filter((game): game is GameData => Boolean(game));

      const selectedIds = new Set(pinned.map((game) => game.app_id));
      const fallbackKeywords = list.fallbackKeywords.map(normalizeToken);

      const fallback = allGames
        .filter((game) => !selectedIds.has(game.app_id))
        .filter((game) => {
          const tokens = gameTokens(game);
          return fallbackKeywords.some((keyword) =>
            tokens.some((token) => token.includes(keyword))
          );
        })
        .sort((a, b) => {
          const playersDiff = (b.activePlayers || 0) - (a.activePlayers || 0);
          if (playersDiff !== 0) return playersDiff;
          return (b.communityRating || 0) - (a.communityRating || 0);
        })
        .slice(0, Math.max(0, 10 - pinned.length));

      return {
        ...list,
        games: [...pinned, ...fallback],
      };
    });
  }, [allGames, manualGameMap]);

  if (allGamesLoading || manualLoading) {
    return (
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <SectionHeader
          title="Listas prontas"
          subtitle="Curadoria para quando voce quer decidir rapido"
          icon={Sparkles}
        />
        <LoadingSkeleton variant="card" count={6} />
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 pb-12 md:pb-16">
      <SectionHeader
        title="Listas prontas"
        subtitle="Curadoria para quando voce quer decidir rapido"
        icon={Sparkles}
      />

      <div className="space-y-8">
        {lists.map((list) => (
          <div key={list.id} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{list.title}</h3>
              <p className="text-sm text-muted-foreground">{list.subtitle}</p>
            </div>

            {list.games.length === 0 ? (
              <div className="rounded-lg border border-border/50 bg-card/40 p-4 text-sm text-muted-foreground">
                Sem jogos suficientes nesta lista por enquanto.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {list.games.map((game, idx) => (
                  <div key={game.app_id} className="min-w-[280px] max-w-[280px]">
                    <GameCard game={game} index={idx} onClick={() => onGameClick(game)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
