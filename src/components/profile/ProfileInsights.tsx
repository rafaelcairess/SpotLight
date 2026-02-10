import { useMemo } from "react";
import { Clock3, Gamepad2, CheckCircle2, Flame } from "lucide-react";
import { UserGame } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";

interface ProfileInsightsProps {
  games: UserGame[];
  isLoading: boolean;
}

const normalizeToken = (value: string) => value.trim().toLowerCase();

export function ProfileInsights({ games, isLoading }: ProfileInsightsProps) {
  const appIds = games.map((game) => game.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);

  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  const metrics = useMemo(() => {
    const totalGames = games.length;
    const totalHours = games.reduce(
      (acc, game) => acc + (typeof game.hours_played === "number" ? game.hours_played : 0),
      0
    );
    const completedCount = games.filter((game) => game.status === "completed").length;
    const completionRate = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

    const topPlayed = [...games]
      .filter((game) => typeof game.hours_played === "number" && game.hours_played > 0)
      .sort((a, b) => (b.hours_played || 0) - (a.hours_played || 0))
      .slice(0, 3)
      .map((game) => ({
        appId: game.app_id,
        hours: Math.round(game.hours_played || 0),
      }));

    const genreCounter = new Map<string, number>();
    for (const userGame of games) {
      const catalogGame = gameMap.get(userGame.app_id);
      if (!catalogGame) continue;

      const tokens = [
        ...(catalogGame.genre ? [catalogGame.genre] : []),
        ...(catalogGame.tags || []),
      ]
        .map(normalizeToken)
        .filter(Boolean);

      const uniqueTokens = Array.from(new Set(tokens));
      for (const token of uniqueTokens) {
        genreCounter.set(token, (genreCounter.get(token) || 0) + 1);
      }
    }

    const favoriteGenre =
      [...genreCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Sem dados";

    return {
      totalHours: Math.round(totalHours),
      completionRate,
      topPlayed,
      favoriteGenre,
    };
  }, [games, gameMap]);

  if (isLoading || catalogLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-16 rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Resumo do perfil</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock3 className="w-3.5 h-3.5" />
            Total de horas
          </div>
          <p className="text-lg font-semibold">{metrics.totalHours}h</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            % concluidos
          </div>
          <p className="text-lg font-semibold">{metrics.completionRate}%</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Gamepad2 className="w-3.5 h-3.5" />
            Mais jogados
          </div>
          {metrics.topPlayed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horas registradas</p>
          ) : (
            <div className="space-y-1">
              {metrics.topPlayed.map((entry) => (
                <p key={entry.appId} className="text-xs text-foreground/90 truncate">
                  {(gameMap.get(entry.appId)?.title || `App ${entry.appId}`) + ` - ${entry.hours}h`}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Flame className="w-3.5 h-3.5" />
            Genero favorito
          </div>
          <p className="text-sm font-semibold capitalize truncate">{metrics.favoriteGenre}</p>
        </div>
      </div>
    </div>
  );
}
