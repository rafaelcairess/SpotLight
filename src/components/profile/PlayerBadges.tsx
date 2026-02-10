import { useMemo } from "react";
import { Shield, Users, Trophy } from "lucide-react";
import { UserGame } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { cn } from "@/lib/utils";

interface PlayerBadgesProps {
  games: UserGame[];
  isLoading: boolean;
}

interface BadgeRule {
  id: string;
  name: string;
  description: string;
  threshold: number;
}

const BADGE_RULES: BadgeRule[] = [
  {
    id: "collector",
    name: "Colecionador",
    description: "Tenha 50 jogos na biblioteca",
    threshold: 50,
  },
  {
    id: "coop-master",
    name: "Co-op Master",
    description: "Tenha 15 jogos co-op na biblioteca",
    threshold: 15,
  },
  {
    id: "platinum-hunter",
    name: "Platina Hunter",
    description: "Conquiste 10 platinas",
    threshold: 10,
  },
];

const normalizeToken = (value: string) => value.trim().toLowerCase();

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function PlayerBadges({ games, isLoading }: PlayerBadgesProps) {
  const appIds = games.map((game) => game.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);

  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  const counters = useMemo(() => {
    const totalGames = games.length;
    const platinumCount = games.filter((game) => game.is_platinumed).length;

    let coopCount = 0;
    for (const userGame of games) {
      const game = gameMap.get(userGame.app_id);
      if (!game) continue;
      const tokens = [
        ...(game.tags || []),
        ...(game.genre ? [game.genre] : []),
      ]
        .map(normalizeToken)
        .filter(Boolean);

      const isCoop = tokens.some(
        (token) =>
          token.includes("co-op") ||
          token.includes("coop") ||
          token.includes("multiplayer") ||
          token.includes("local co-op") ||
          token.includes("online co-op")
      );

      if (isCoop) coopCount += 1;
    }

    return {
      collector: totalGames,
      "coop-master": coopCount,
      "platinum-hunter": platinumCount,
    } as Record<string, number>;
  }, [games, gameMap]);

  const iconMap = {
    collector: Shield,
    "coop-master": Users,
    "platinum-hunter": Trophy,
  } as const;

  if (isLoading || catalogLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
        <div className="h-5 w-36 bg-secondary rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-24 rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Badges de jogador</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {BADGE_RULES.map((badge) => {
          const value = counters[badge.id] || 0;
          const progress = badge.threshold > 0 ? clamp((value / badge.threshold) * 100) : 0;
          const unlocked = value >= badge.threshold;
          const Icon = iconMap[badge.id as keyof typeof iconMap];

          return (
            <div
              key={badge.id}
              className={cn(
                "rounded-lg border p-3",
                unlocked
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/40 bg-secondary/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "p-1.5 rounded-md",
                    unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">
                    {Math.min(value, badge.threshold)}/{badge.threshold}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      unlocked ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
