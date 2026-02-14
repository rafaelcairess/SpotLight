import { useMemo, useState } from "react";
import { Star, Settings } from "lucide-react";
import { useUserTopGames } from "@/hooks/useTopGames";
import { useGamesByIds, useSearchGames } from "@/hooks/useGames";
import { UserGame } from "@/hooks/useUserGames";
import { GameData } from "@/types/game";
import { useSetTopGame } from "@/hooks/useTopGames";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProfileTopGamesProps {
  userId?: string;
  games: UserGame[];
  isLoading: boolean;
  readOnly?: boolean;
  onGameSelect?: (game: GameData) => void;
}

const POSITIONS = [1, 2, 3, 4, 5];
const RANK_COLORS: Record<number, string> = {
  1: "#d4af37",
  2: "#c0c0c0",
  3: "#cd7f32",
};

export function ProfileTopGames({
  userId,
  games: _games,
  isLoading,
  readOnly = false,
  onGameSelect,
}: ProfileTopGamesProps) {
  const { data: topGames = [], isLoading: topLoading } = useUserTopGames(userId, !userId);
  const { mutateAsync: setTopGame, isPending } = useSetTopGame();
  const [search, setSearch] = useState("");
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const topAppIds = topGames.map((entry) => entry.app_id);

  const { data: topCatalog = [], isLoading: topCatalogLoading } = useGamesByIds(topAppIds);
  const { data: searchResults = [], isLoading: searchLoading } = useSearchGames(search, 20);

  const topMap = useMemo(
    () => new Map(topCatalog.map((game) => [game.app_id, game])),
    [topCatalog]
  );

  const topByPosition = useMemo(() => {
    const map = new Map<number, number>();
    topGames.forEach((entry) => map.set(entry.position, entry.app_id));
    return map;
  }, [topGames]);

  const defaultPosition = useMemo(() => {
    for (const position of POSITIONS) {
      if (!topByPosition.has(position)) return position;
    }
    return POSITIONS[0];
  }, [topByPosition]);

  const currentPosition = activePosition ?? defaultPosition;

  if (isLoading || topLoading || topCatalogLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="h-20 rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Top 5 jogos</h3>
            <p className="text-xs text-muted-foreground">
              {readOnly ? "Favoritos do jogador" : "Escolha seus favoritos"}
            </p>
          </div>
        </div>
        {!readOnly && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => {
              setActivePosition(defaultPosition);
              setDialogOpen(true);
            }}
            aria-label="Configurar Top 5"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {POSITIONS.map((position) => {
          const appId = topByPosition.get(position);
          const game = appId ? topMap.get(appId) : undefined;

          return (
            <div
              key={position}
              className={cn(
                "flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-border/40 bg-card p-4",
                currentPosition === position && !readOnly && "ring-1 ring-primary/40"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                  {game?.image ? (
                    <img
                      src={game.image}
                      alt={game.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {game ? (
                    <button
                      type="button"
                      onClick={() => game && onGameSelect?.(game)}
                      className={cn(
                        "w-full text-left space-y-1",
                        onGameSelect && "hover:text-primary transition-colors"
                      )}
                    >
                      <p className="font-semibold text-sm leading-tight line-clamp-2">
                        {game.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {game.genre || "Sem gênero"}
                      </p>
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Escolha um jogo</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 text-xs font-semibold"
                  style={{ color: RANK_COLORS[position] ?? "var(--foreground)" }}
                >
                  #{position}
                </div>
                {!readOnly && (
                  <span className="text-xs text-muted-foreground">&nbsp;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSearch("");
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>Configurar Top #{currentPosition}</DialogTitle>
                {topByPosition.get(currentPosition) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={async () => {
                      await setTopGame({ position: currentPosition, appId: null });
                      setDialogOpen(false);
                      setSearch("");
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {POSITIONS.map((position) => (
                  <Button
                    key={position}
                    type="button"
                    size="sm"
                    variant={currentPosition === position ? "secondary" : "outline"}
                    onClick={() => setActivePosition(position)}
                  >
                    #{position}
                  </Button>
                ))}
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o nome do jogo..."
                autoFocus
              />

              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {search.trim().length < 2 && (
                  <div className="text-xs text-muted-foreground">
                    Digite ao menos 2 letras para buscar.
                  </div>
                )}
                {search.trim().length >= 2 && searchLoading && (
                  <div className="text-xs text-muted-foreground">Buscando jogos...</div>
                )}
                {search.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <div className="text-xs text-muted-foreground">Nenhum jogo encontrado.</div>
                )}
                {searchResults.map((result) => (
                  <button
                    key={result.app_id}
                    type="button"
                    disabled={isPending}
                    onClick={async () => {
                      await setTopGame({ position: currentPosition, appId: result.app_id });
                      setDialogOpen(false);
                      setSearch("");
                    }}
                    className="w-full rounded-lg border border-border/40 bg-card px-3 py-3 text-left transition hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">
                          {result.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.genre || "Sem gênero"}
                        </p>
                      </div>
                      <span className="text-xs text-primary">Adicionar</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
