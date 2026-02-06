import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGamesByIds } from "@/hooks/useGames";
import { UserGame } from "@/hooks/useUserGames";

interface TrophyShowcaseProps {
  games: UserGame[];
  isLoading: boolean;
}

export function TrophyShowcase({ games, isLoading }: TrophyShowcaseProps) {
  const appIds = games.map((game) => game.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);
  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  if (isLoading || catalogLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded" />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-video rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Vitrine de Platinas</h3>
            <p className="text-xs text-muted-foreground">Seus troféus mais raros</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-amber-500">
          {games.length} Platinas
        </Badge>
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">
          Ainda sem platinas. Complete seu primeiro jogo e ganhe um troféu!
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {games.map((userGame) => {
            const gameInfo = gameMap.get(userGame.app_id);
            if (!gameInfo) return null;

            return (
              <div
                key={userGame.id}
                className="group relative overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5"
              >
                <div className="aspect-video">
                  <img
                    src={gameInfo.image}
                    alt={gameInfo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-amber-500/90">
                  <Trophy className="w-3 h-3 text-black" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-semibold text-white line-clamp-1">
                    {gameInfo.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}