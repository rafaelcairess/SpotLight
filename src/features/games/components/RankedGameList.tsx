import type { GameData } from "@/types/game";

interface RankedGameListProps<T extends GameData> {
  games: T[];
  onGameSelect: (game: T) => void;
  emptyGenreLabel: string;
  formatPlayers: (game: T) => string;
}

/** Shared accessible list presentation for ranking pages. */
export function RankedGameList<T extends GameData>({
  games,
  onGameSelect,
  emptyGenreLabel,
  formatPlayers,
}: RankedGameListProps<T>) {
  return (
    <div className="space-y-2">
      {games.map((game, index) => {
        const playerLabel = formatPlayers(game);
        return (
          <button
            key={game.app_id}
            type="button"
            onClick={() => onGameSelect(game)}
            className="w-full rounded-xl border border-border/40 bg-card/50 p-2.5 text-left transition-colors hover:border-primary/40 sm:p-3"
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="w-8 shrink-0 text-center sm:w-10">
                <span className="text-base font-bold text-primary sm:text-lg">#{index + 1}</span>
              </div>
              <img
                src={game.image}
                alt={game.title}
                loading="lazy"
                decoding="async"
                className="h-11 w-16 shrink-0 rounded object-cover sm:h-14 sm:w-24"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{game.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {game.genre || emptyGenreLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:hidden">
                  {playerLabel}
                </p>
              </div>
              <div className="hidden min-w-[160px] text-right sm:block">
                <p className="text-xs text-muted-foreground">{playerLabel}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
