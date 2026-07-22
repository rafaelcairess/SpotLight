import { useGamesByIds } from "@/hooks/useGames";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { usePlatinumShowcase } from "@/hooks/usePlatinumShowcase";
import { isMatureGame } from "@/lib/matureFilter";

export function PlatinumShowcase({ userId, onViewAll }: { userId?: string; onViewAll?: () => void }) {
  const { data: entries = [] } = usePlatinumShowcase(userId);
  const { data: games = [] } = useGamesByIds(entries.map((entry) => entry.app_id));
  const [showMature] = useMaturePreference();
  const entriesById = new Map(entries.map((entry) => [entry.app_id, entry]));
  const visibleGames = games.filter((game) => showMature || !isMatureGame(game));

  if (!visibleGames.length) return null;

  return (
    <section className="overflow-hidden rounded-lg bg-black/15">
      <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-primary/10 px-4 py-2.5">
        <h2 className="text-sm font-medium">Jogos platinados</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">Ver todos</button>}
      </header>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {visibleGames.map((game) => {
          const entry = entriesById.get(game.app_id);
          return (
            <article key={game.app_id} className="flex items-center gap-3 rounded-md bg-black/20 p-2.5">
              <img src={game.image} alt="" className="aspect-[460/215] w-28 rounded object-cover" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">{game.title}</h3>
                {entry?.hours_played != null && <p className="mt-1 text-xs text-muted-foreground">{entry.hours_played.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} horas</p>}
                <p className="mt-1 text-xs text-amber-400">Platinado</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
