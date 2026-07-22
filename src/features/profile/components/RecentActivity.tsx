import { Clock3 } from "lucide-react";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useGamesByIds } from "@/hooks/useGames";

const formatHours = (value: number | null) =>
  (value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function RecentActivity({ userId }: { userId?: string }) {
  const { data: activity = [], isLoading } = useRecentActivity(userId);
  const { data: games = [] } = useGamesByIds(activity.map((item) => item.app_id));
  const gamesById = new Map(games.map((game) => [game.app_id, game]));
  const recentHours = activity.reduce((total, item) => total + Number(item.playtime_2weeks || 0), 0);

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-black/15" />;
  if (!activity.length) return null;

  return (
    <section className="overflow-hidden rounded-lg bg-black/15">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-primary/10 px-4 py-3">
        <h2 className="font-semibold">Atividade recente</h2>
        {recentHours > 0 && <span className="text-xs text-muted-foreground">{formatHours(recentHours)} horas nas últimas 2 semanas</span>}
      </header>
      <div className="divide-y divide-white/5 px-4">
        {activity.map((item) => {
          const game = gamesById.get(item.app_id);
          const playedAt = item.last_played_at ? new Date(item.last_played_at) : null;
          return (
            <article key={item.app_id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <img
                src={game?.image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.app_id}/header.jpg`}
                alt=""
                className="aspect-[460/215] w-full rounded object-cover sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{game?.title || `Jogo ${item.app_id}`}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{formatHours(item.hours_played)} horas registradas</p>
                {playedAt && <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Jogado em {playedAt.toLocaleDateString("pt-BR")}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
